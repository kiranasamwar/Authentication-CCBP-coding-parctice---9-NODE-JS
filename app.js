const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());

let db = null;

const dbPath = path.join(__dirname, "userData.db");

const dbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (error) {
    response.send(`Db error ${error}`);
    process.exit(1);
  }
};
dbServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const hashedPassword = await bcrypt.hash(request.body.password, 10);

  const usernameQuery = `
  SELECT 
  *
  FROM 
  user
  WHERE
  username = '${username}'`;
  const dbUser = await db.get(usernameQuery);
  if (dbUser === undefined) {
    const creatUserQuery = `
    INSERT INTO
    user(username,name,password,gender,location)
    VALUES(
        '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}'
    );`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newUserDetails = await db.run(creatUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const usernameQuery = `
  select
  *
  from
  user
  where
  username = '${username}'`;
  const dbUser = await db.get(usernameQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordIsMach = await bcrypt.compare(password, dbUser.password);
    if (isPasswordIsMach === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userForUserQuery = `select * from user where username = '${username}'`;
  const dbUser = await db.get(userForUserQuery);
  if (dbUser === undefined) {
    response.stats(400);
    response.send("User not registered");
  } else {
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (isValidPassword === true) {
      const lengthOfPassword = newPassword.length;
      if (lengthOfPassword < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `
        update user set password = '${encryptPassword}'
        where username = '${username}'`;
        await db.run(updatePasswordQuery);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
