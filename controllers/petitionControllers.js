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
