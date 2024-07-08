import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user:"postgres",
  host:"localhost",
  database:"world",
  password:"postgres",
  port:5432,
});
db.connect();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function checkVisisted(){
  const result = await db.query("SELECT country_code FROM visited_countries");
  
  let countries = [];
  result.rows.forEach((country)=>{
    countries.push(country.country_code);
    //console.log(country.country_code);
  });
  return countries;
  
  }

app.get("/", async (req, res) => {

  const countries = await checkVisisted();
  res.render("index.ejs",{
    countries:countries,
    total:countries.length
  });

 
});
app.post("/add",async (req,res)=>{
  const input = req.body["country"];

  // const result = await db.query("SELECT country_code FROM countries WHERE country_name = $1",[input]);
  // if(result.rows.length!==0){
  //   const data = result.rows[0];
  //   const country_code = data.country_code;
  //   await db.query("INSERT INTO visited_countries(country_code) VALUES ($1)",[country_code]);
  //   res.redirect("/");
  // }


  //Improving user experience nad handling edge cases
  //1. If country doesn't exist
  //2. If country is already added in visited_countries


  try{
    const result = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]);
    //eg %TANZANIA% as long as the one word exists it is accepted
    const data = result.rows[0];
    const countryCode = data.country_code;
    console.log(countryCode);
    try{
      await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)",[countryCode]);
      res.redirect("/");
    }
    catch(err){
      console.log(err);
      const countries = await checkVisisted();
      res.render("index.ejs",{
        countries : countries,
        total: countries.length,
        error:"Country has already been added, try again.",
      });
    }

  }
  catch(err){
    console.log(err);
    const countries = await checkVisisted();
    res.render("index.ejs",{
      countries:countries,
      total:countries.length,
      error:"Country does not exist, try again,",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

