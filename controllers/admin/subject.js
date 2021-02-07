const { validationResult } = require('express-validator');

const Subject = require('../../models/subject');
const {
  checkStatusCode,
  createError
} = require('../../util/error-handler');

exports.createSubject = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    throw createError('Validation failed D:', 422, errors.array());

  const { id, name, creditLab, creditTheory } = req.body;
  const subject = new Subject({
    id, 
    name, 
    creditLab, 
    creditTheory
  });

  try {
    await subject.save();
    res.status(201).json({
      message: 'Created subject :D',
      subject
    });
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find();
    res.status(200).json({
      message: 'Fetched all subjects :D',
      subjects
    })
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.getSubject = (req, res, next) => {

};

exports.updateSubject = (req, res, next) => {
  
};

exports.deleteSubject = (req, res, next) => {

};
