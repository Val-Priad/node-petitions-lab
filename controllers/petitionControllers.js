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

exports.getPetitionOverview = async (req, res) => {
  const petitionId = req.params.id;
  
  try {
    const petition = await Petition.findOne({
      where: { id: petitionId },
      include: [{
        model: Author,
        attributes: ['username'],
        as: 'Author'
      }]
    });
    
    if (!petition) {
      return res.status(404).send("Петиція не знайдена");
    }

    res.render('view-petition', {
      id: petition.id,
      title: petition.title,
      text: petition.text,
      author_username: petition.Author.username,
      petition_current: petition.petition_current,
      expiry_date: formatDate(petition.expiry_date)
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Помилка сервера");
  }
};

exports.petitionVoting = async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Необхідно авторизуватися" });
  }
  
  const userId = req.session.user.id;
  const petitionId = req.params.id;

  const t = await sequelize.transaction();

  try {
    const [signature, created] = await Signature.findOrCreate({
      where: { author_id: userId, petition_id: petitionId },
      defaults: { author_id: userId, petition_id: petitionId },
      transaction: t
    });

    if (!created) {
      await t.rollback();
      return res.status(400).json({ message: "Ви вже голосували за цю петицію" });
    }

    await Petition.increment('petition_current', {
      by: 1,
      where: { id: petitionId },
      transaction: t
    });

    const updatedPetition = await Petition.findByPk(petitionId, { transaction: t });

    await t.commit();

    return res.status(200).json({
      message: "Голос зараховано",
      petition_current: updatedPetition.petition_current
    });
  } catch (err) {
    await t.rollback();
    console.error(err);
    return res.status(500).json({ message: "Помилка сервера" });
  }
};

exports.getCompletedPetitions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const offset = (page - 1) * limit;

    const selectedStatus = req.query.status; 

    const whereClause = {
      status: { [Op.ne]: 'In_Progress' }
    };

    if (selectedStatus) {
      whereClause.status = selectedStatus;
    }

    const { count, rows: completedPetitions } = await Petition.findAndCountAll({
      where: whereClause,
      include: [{
        model: Author,
        attributes: ['username'],
        as: 'Author'
      }],
      order: [['creation_date', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    const formattedPetitions = completedPetitions.map(petition => ({
      ...petition.get({ plain: true }),
      creation_date: formatDate(petition.creation_date),
      expiry_date: formatDate(petition.expiry_date),
      author_username: petition.Author.username
    }));

    res.render("completed-petitions", {
      petitions: formattedPetitions,
      currentPage: page,
      totalPages,
      statusMap,
      selectedStatus
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Помилка сервера");
  }
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
