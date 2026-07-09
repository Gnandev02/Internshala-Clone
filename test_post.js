const axios = require('axios');

const formData = {
  title: "Test Job",
  company: "Test Company",
  location: "Test Location",
  category: "Test Category",
  aboutCompany: "Test about",
  aboutJob: "Test job desc",
  whoCanApply: "Anyone",
  perks: "Free coffee",
  numberOfOpening: "2",
  CTC: "10 LPA",
  startDate: "2025-01-01",
  AdditionalInfo: "None"
};

axios.post("http://localhost:5000/api/job", formData)
  .then(res => {
    console.log("SUCCESS:", res.data);
  })
  .catch(err => {
    console.error("ERROR:", err.message);
  });
