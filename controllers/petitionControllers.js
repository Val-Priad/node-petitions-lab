const { Petition, Author, Signature, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getPetitions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Текущая страница, по умолчанию 1
    const limit = 5; // Петиций на страницу
    const skippedValue = (page - 1) * limit;

    const { count, rows: petitions } = await Petition.findAndCountAll({
      where: { status: "In_Progress" },
      include: [{
        model: Author,
        attributes: ['username'],
        as: 'Author'
      }],
      order: [['creation_date', 'DESC']],
      limit,
      offset: skippedValue
    });

    const totalPages = Math.ceil(count / limit);

    const formattedPetitions = petitions.map(petition => ({
      ...petition.get({ plain: true }),
      creation_date: formatDate(petition.creation_date),
      expiry_date: formatDate(petition.expiry_date),
      author_username: petition.Author.username
    }));

    res.render('index', {
      petitions: formattedPetitions,
      currentPage: page,
      totalPages
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Помилка сервера");
  }
};

exports.getPetitionCreationPage = (req, res) => {
  res.render('create-petition');
};


exports.petitionCreation = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      message: "Авторизуйтеся для створення петиції"
    });
  }

  const { title, text } = req.body;
  if (!title || !text) {
    return res.status(400).json({
      message: "Необхідно заповнити всі поля"
    });
  }

  const author_id = req.session.user.id;
  const creation_date = new Date();
  const expiry_date = new Date();
  expiry_date.setMonth(creation_date.getMonth() + 1);

  const t = await sequelize.transaction();

  try {
    const newPetition = await Petition.create({
      author_id,
      title,
      text,
      creation_date,
      expiry_date,
      status: "In_Progress",
      petition_current: 0
    }, { transaction: t });

    await t.commit();
    
    res.status(201).json({
      status: 'success',
      data: {
        petition: {
          id: newPetition.id,
          title: newPetition.title,
          text: newPetition.text,
          petition_current: newPetition.petition_current,
          creation_date: formatDate(newPetition.creation_date),
          expiry_date: formatDate(newPetition.expiry_date),
          status: newPetition.status
        }
      }
    });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({
      status: 'fail',
      message: err.message
    });
  }
};
