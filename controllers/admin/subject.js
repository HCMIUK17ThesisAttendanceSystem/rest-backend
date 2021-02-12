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

exports.getSubject = async (req, res, next) => {
  const { subjectId } = req.body;

  try {
    const subject = await Subject.findById(subjectId);
    if (!subject)
      throw createError('Subject not found D:', 404);

    res.status(200).json({
      message: 'Subject fetched :D',
      subject
    });
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.updateSubject = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    throw createError('Validation failed D:', 422, errors.array());

  const { subjectId, id, name, creditLab, creditTheory } = req.body;
  try {
    const subject = await Subject.findById(subjectId);
    if (!subject)
      throw createError('Subject not found D:', 404);

    subject.id = id;
    subject.name = name;
    subject.creditLab = creditLab;
    subject.creditTheory = creditTheory;
    await subject.save();
    
    res.status(200).json({
      message: 'Subject updated :D',
      subject
    })
  } catch (error) {
    checkStatusCode(error, next);
  }
};

exports.deleteSubject = async (req, res, next) => {
  const { subjectId } = req.body;
  try {
    const subject = await Subject.findById(subjectId);
    if (!subject)
      throw createError('Subject not found D:', 404);

    await Subject.findByIdAndRemove(subjectId);
    res.status(200).json({
      message: 'Subject deleted :D',
      subjectName: subject.name
    });
  } catch (error) {
    checkStatusCode(error, next);
  }
};
