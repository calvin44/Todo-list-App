// require modules
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({ extended: true }, { useUnifiedTopology: true })
);
app.use(express.static("public"));

// connect to mongoose database
mongoose.connect(
  // using mongodb atlas => online hosted database
  "mongodb+srv://admin-calvin:test123@cluster0.vqqrs.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
  }
);

// create new schema
const itemsSchema = {
  name: String,
};

// create a mongoose model
const Item = mongoose.model("item", itemsSchema);

// create a default item in mongo database
const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

// array for default item to be inserted into database
const defaultItems = [item1, item2, item3];

// create list schema
const listSchema = {
  name: String,
  items: [itemsSchema],
};

// create model
const List = mongoose.model("List", listSchema);

// page routing
app.get("/", function (req, res) {
  // const day = date.getDate();

  // get item from database
  Item.find({}, function (err, foundItems) {
    // check if the default item is in the database
    if (foundItems.length === 0) {
      // insert default item into the database
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("success");
        }
      });
      // refresh the page
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

// dynamic routing
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        // create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// delete page for deleting todo list
app.post("/delete", function (req, res) {
  // getting the particular id of input to be deleted !
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    // execute mongoose remove by id with id we get from the form submittion
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Sucessfully deleted checked item.");
      } else {
        console.log(err);
      }
    });
    // redirect back to the homepage after delete operation
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started on port 3000");
});
