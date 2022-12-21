//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
mongoose.set('strictQuery', true);

const app = express();
const day = date.getDate();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://zhongwez:1234567zzw@cluster0.nzznv2e.mongodb.net/toDoList");

const tasksSchema = new mongoose.Schema({
    name: {
      type: String 
    }
})

const listSchema = new mongoose.Schema({
  name: String,
  items: [tasksSchema]
})

const Task = new mongoose.model("Task", tasksSchema);
const List = new mongoose.model("List", listSchema);

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

const buyFood = new Task({
  name: "Buy Food"
})

const cookFood = new Task({
  name: "Cook Food"
})

const eatFood = new Task({
  name: "Eat Food"
})

const defaultTasks = [buyFood, cookFood, eatFood];


app.get("/", function(req, res) {
  
  Task.find({}, (err, results)=>{
    if (results.length === 0) {
      Task.insertMany(defaultTasks, (err)=>{
        if (err) {
          console.log(err);
        }
        else {
          console.log("Successfully added the default values!")
        }
      })
      res.redirect("/");
    }
    else {
      res.render("list", {listTitle: day, newListItems: results});
    }
  })

  

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Task({
    name: itemName
  });

  if (listName === day) {
    item.save(()=>{
      res.redirect("/");
    });
  }
  else {
    List.findOne({name: listName}, (err, foundList)=>{
      foundList.items.push(item);
      foundList.save(()=>{
        res.redirect("/" + listName);
      });
    });
  }
  
});

// why use another post route?
app.post("/delete", async (req,res)=>{
  const toDeleteItemId = await req.body.checkbox;
  const listName = await req.body.listName;

  if (listName === day) {
    Task.findByIdAndRemove(toDeleteItemId, (err)=>{
      if(err){
        console.log(err);
      }
      else {
        res.redirect("/");
      }
    });
  }
  else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: toDeleteItemId}}}, (err)=>{
      if (err) {
        console.log(err);
      }
      else {
        res.redirect("/" + listName);
      }
    })
  }
  
  
})


app.get("/about", function(req, res){
  res.render("about");
});


// ********************************************************************************************************************
// Customized toDoLost 

app.get("/:customListName", async (req, res)=>{
  const customListName = await _.capitalize(req.params.customListName);

  if (customListName === "Favicon.ico") return;

  List.findOne({name: customListName}, (err, foundList)=>{
    if (err) {
      console.log(err);
    }
    else {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultTasks
        });
        list.save(()=>{
          res.redirect("/"+customListName);
        });
      }
      else {
        res.render("list",{listTitle: customListName, newListItems: foundList.items})
      }
    }
  })

});




app.listen(3000, function() {
  console.log("Server started on port 3000");
});
