import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "tokk1234",
  port: "5432",
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function Checklist() {
  const result = await db.query("select country_code from visited_countries");
  const countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

function capitalizeFirstLetter(text) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

app.get("/", async (req, res) => {
  const contries = await Checklist();
  res.render("index.ejs", { total: contries.length, countries: contries });
});

/////////// INSERT NEW DATA ///////////////////

app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const inputCorection = capitalizeFirstLetter(input);

  try {
    const CheckCountryName = await db.query(
      "SELECT country_code FROM countries WHERE country_name = $1",
      [inputCorection]
    );

    const checkVisisted = await Checklist();
    const checkScored = checkVisisted.length + 1;
    const data = CheckCountryName.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
      const countries = await Checklist();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country has already been added, try again.",
      });
    }
  } catch (err) {
    console.log(err);
    const countries = await Checklist();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country name does not exist, try again.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
