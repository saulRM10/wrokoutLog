// template to creating a server in node js 
// install npm  -> npm install 
// instal express and body-parser -> npm install express body-parser
// update server when there is a change -> nodemon nameofFile.js 

const express = require("express");
const bodyParcer = require("body-parser");
const { setServers } = require("dns");

const mongoose = require("mongoose");
const { redirect } = require("statuses");
const { all, timeout } = require("async");
const { homedir } = require("os");

const app = express();

// use ejs 
app.set('view engine', 'ejs');

// use body parcer 
app.use(bodyParcer.urlencoded({extended:true }));

//app.use(express.static("public"));// use these static elements (css, imgs etc )
// need an array of items to store the to list items 

let listofExr =[];

// number of sets 
let sets = 0;


// lets use a database
// 1) install mongoose -> npm i mongoose 
// 2) require mongoose 
// 3) connect to mongo
mongoose.connect("mongodb://localhost:27017/ExerciseDB",{useNewUrlParser: true , useUnifiedTopology: true});

// 4) create a database schema 

const itemsSchema = {
  // add a routine ID so ik which list of exercises belongs to what routine 
    routine_id: String, 
    // need to validate the data 
    name: {
            type: String, 
            required: [true, 'name required'], 
            minlength: [2, 'name must be at least 2 characters.'],
            maxlength: [20, 'name must be less than 20 characters.']
          },
    sets: {
            type: String,
            required: [true, 'set number required'],
            minlength: [1, 'set must be at least 1 characters.'], 
            maxlength: [2, 'set must be at less than 2 characters.']
          },
    reps: {
            type: String,
            required: [true, 'set number required'],
            minlength: [1, 'set must be at least 1 characters.'], 
            maxlength: [2, 'set must be at less than 2 characters.']
          },
    weight: Array
  };
  // 5) cerate a mongoose model based on the schema 
const Item = mongoose.model("Item", itemsSchema);

// when a routine is created it will have zero items
const blanks = [];


  //create a place to store multiple workout log 
const logSchema ={
  WkName: {
              type: String, 
              required: [true, 'name required'],
              minlength: [2, 'name must be at least 2 characters.'],
              maxlength: [20, 'name must be less than 20 characters.']
          }, 
  // contains an array of 'items' = exercises, sets , reps , weight 
  logs: [itemsSchema] 
};

// create a mongoose model based on the second schema 
const Log = mongoose.model("Log", logSchema);
 

  let openMenue = 0;
  let openValueId; 

    let logNames =[];

    let newItems = [];

    // create a global variable to know what routine we are on;
    let inthisRoutine = 'home' ; 
// go home and render home page 
// /goHome
app.get("/", function(require, response){


  // get page name, find a page name with that name and send it there 

  const pageName= require.body.newpageName;

  Log.find({ WkName : pageName}, function(err, templogs){

    if( !err){
      response.redirect("/"+ pageName);
    }
    else {
      response.redirect("/");
    }
  })

  // if page does not exist send it to /+pagename to get created 
    Log.find({},{ WkName:1},{_id: 0},function(err, logNamesHere){

      if(!err){
       
        response.render('home',{  listofNames: logNamesHere, OpenEditId: openValueId });
      }

    });


  
  });




// get user data from the form and use it redirect to /customLogName 
app.post("/newpage", function(require, response){

  //if( !err){
    const pageName= require.body.newpageName;
    
    response.redirect("/"+ pageName);
 // }
  //else {
    response.redirect("/");
  //}
 

   
});
/**
 * 
 * log.find() // need to find a specific log, given the name WkName. Which returns a cursor with the results in 'foundLogs' 
 *  
 * if foundLogs is empty = no routine with the name of WkName exist 
 *        then we must create that routine of name WkName
 *            a routine needs a name, WkName and a list of Exercises 
 *  
 *            to populate the list of exercises, we need to look at the Items collection
 *            but how do I know that the list of exercises belongs to a routine ???
 * 
 *            Assuming we know  specific collection 
 * 
 * 
 * 
 *          items are being deleted from items collection but in logs collection they still exist// not rendered but in the logs collection
 */
// create new workout log, named whatever you want
app.get("/:customLogName", function(require,response){
    
    const customLogName = require.params.customLogName;

    // use this variable, to know what log we are in at all times. 
      inthisRoutine = customLogName;
      // need to check if a 'log' of the same name already exist
       
      Log.findOne({ WkName:customLogName}, function(err , foundLogs){
        
          
     // If no documents match the specified query, the promise resolves to null
        if ( foundLogs == null){
            // need to just create it 
             Log.insertMany([{ WkName:customLogName , logs: blanks }],function(err){

              logNames.push(customLogName);

             }); 
    
     
            response.redirect("/"+ customLogName);
            // need to give it items, 
         } 

        // Document match the specified query, the promise is NOT null 
        if( foundLogs != null ) {

            // find the exercises that match the id of the routine, and store the results in foundItems //routine_id: foundLogs._id
            Item.find({routine_id: foundLogs._id}, function(err, foundItems){ // start of Item.find()

                  
                      var updateLogs = {
                                          $set:
                                          {
                                            logs: foundItems
                                          }
                      };
                    Log.updateOne({ WkName:customLogName }, updateLogs , function(err){ // Log.insertMany() start 

                      }); // Log.insertMany() end 

                 response.render('index', { routineName: foundLogs.WkName , workout: foundItems, OpenEditId: openValueId , routineID: foundLogs._id });
            });// end of Item.find()
        }
        
      })
});


app.post("/createItem", function(require, response){

    let exrName = require.body.newExr;

    let NumSet = require.body.setNum;
  

    let NumReps = require.body.repsNum;

    let wght = require.body.weight;

    // create an array of weight to store the weight 
     let weightDatastring =[];
     weightDatastring = wght.split(',');

   
    const routineID = require.body.button;

    // get number of sets and then give them the input space so we can collect the data to then display
        // create the 'object'
   const myobj = { routine_id: routineID ,name: exrName, sets: NumSet, reps: NumReps , weight: weightDatastring };



//Need to see what routine this myObj belongs too 
  Log.findOne({_id: routineID}, function(err, foundLogs){
try{
    // insert to items collections as well 
      Item.insertMany(myobj); 
    
    // tap in to found logs, tap in to items, push myobj into array of items (items = exercise + sets + reps + weight ) 
      foundLogs.logs.push(myobj);

      foundLogs.save();
}
catch(err) { console.log( " this is the error: " + err ); }
      // render the new item in the routine it belongs too 
      response.redirect("/" + inthisRoutine);
  });
});
  





app.post("/deleteRoutine", function(require, response){

  const dtRoutine = require.body.deltRotn;
  

    Log.deleteOne({_id: dtRoutine}, function(err){

      if( !err){
        console.log("log has been deleted successfully");
    }
    // deleted the item, not go back to root and render what we do have left
    response.redirect("/");
    });
});


/// used to delete items of the list
app.post("/delete", function(require, response ){

    const noMore = require.body.skip;
      console.log("this is the item id of the deleted item: " + noMore);
      Item.deleteOne({_id:noMore}, function(err){

        
        if(!err){
          console.log("delete this item with an ID of : "+noMore);
        }
      });
      response.redirect("/" + inthisRoutine);
   // }); 
});

// create a route to update item 
app.post("/update", function(require,response){

    
    const updateItem = require.body.needsUpdate;
    
    let newName = require.body.updateName;
    let newSetNum = require.body.updateSetNum;
    let newRepNum = require.body.updateRepNum;
    let newWeight= require.body.updateWeight;

    let NewWeightDatastring =[];
    NewWeightDatastring = newWeight.split(',');

      var newValues = { 
        $set: 
          {
            name: newName, 
            sets: newSetNum, 
            reps: newRepNum, 
            weight: NewWeightDatastring  }
           };
      //let userInput = response.body.newItemData; 

      // updated the item, not go back to root and render what we do have left
  Item.updateOne( {_id: updateItem},newValues,function(err, response) {

    if(!err){
             console.log("item updated in LOG: " + inthisRoutine );
            }
       
        });

        
    response.redirect("/" + inthisRoutine );

  

    
});

app.post("/updateRoutineName", function(require,response){

    const newRoutineName = require.body.updateRoutineName;
    const updateItem = require.body.needsUpdate;
   
    var updatedName = {
                          $set:
                              {
                                WkName: newRoutineName
                              }};
    Log.updateOne({ _id : updateItem}, updatedName, function(err, response) {
          
          if( !err){

            console.log("item has been updated successfully for item:" );
            
          }

      });

response.redirect("/");

});

// gets 
app.post("/openId", function(require, response){

  // i am on this item, item I want to edit ( name, reps, sets, weight)
   openValueId = require.body.editBtn;
   response.redirect("/" + inthisRoutine);

});

app.post("/openIdRoutine", function(require, response){

  // i am on this item, item I want to edit ( name, reps, sets, weight)
   openValueId = require.body.editBtn;

  response.redirect("/");


});



// close the 'edit' pop up  
app.post("/close", function(require,response){

  openValueId = null; 

  
  // go to the specific page you are doing the edit;
  response.redirect("/" + inthisRoutine);
  
});

app.post("/closeRoutine", function(require, response){

  openValueId = null; 

  response.redirect("/"); // redirect home
});



app.listen(5000,function(){
    console.log("connected to port 5000");
});
 