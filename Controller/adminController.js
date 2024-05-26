const dashboard = async (req, res) => {
  try {
    res.render("dashboard");
  } catch (error) {
    console.log(`error from dashboaer: ${error}`);
  }
};


module.exports = {
    dashboard,
}