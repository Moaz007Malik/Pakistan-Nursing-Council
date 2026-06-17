const setViewUrl = (doc) => {
  if (!doc || typeof doc !== 'object' || !doc._id) return doc;
  if (doc.viewUrl) return doc;

  if (doc.metadata?.secureUrl) {
    doc.viewUrl = doc.metadata.secureUrl;
  } else {
    doc.viewUrl = `/api/documents/${doc._id}/download`;
  }
  return doc;
};

const attachStudentDocumentUrls = (student) => {
  const data = student.toObject ? student.toObject({ virtuals: true }) : student;

  if (data.documents) {
    setViewUrl(data.documents.cnic);
    setViewUrl(data.documents.picture);
    (data.documents.certificates || []).forEach(setViewUrl);
  }

  if (data.academicInfo?.matric) setViewUrl(data.academicInfo.matric.certificate);
  if (data.academicInfo?.fsc) setViewUrl(data.academicInfo.fsc.certificate);

  return data;
};

const attachFacultyDocumentUrls = (faculty) => {
  const data = faculty.toObject ? faculty.toObject({ virtuals: true }) : faculty;

  if (data.documents) {
    setViewUrl(data.documents.cnic);
    setViewUrl(data.documents.picture);
    setViewUrl(data.documents.registrationCard);
    setViewUrl(data.documents.salarySlip);
    (data.documents.degrees || []).forEach(setViewUrl);
    (data.documents.licenses || []).forEach(setViewUrl);
  }

  return data;
};

module.exports = {
  setViewUrl,
  attachStudentDocumentUrls,
  attachFacultyDocumentUrls,
};
