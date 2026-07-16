const axios = require('axios');

const formData = {
  company: "Test",
  category: "Test",
  coverLetter: "Test Cover Letter",
  user: { name: "Test User" },
  Application: "12345",
  availability: "Yes",
  body: "Test Body"
};

axios.post("http://localhost:5000/api/application", formData)
  .then(res => {
    console.log("SUCCESS:", res.data);
  })
  .catch(err => {
    console.error("ERROR:", err.message);
  });
