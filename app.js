// template to creating a server in node js 
// install npm  -> npm install 
// instal express and body-parser -> npm install express body-parser
// update server when there is a change -> nodemon nameofFile.js 

const express = require("express");
const bodyParser = require("body-parser");
//const { setServers } = require("dns");

const mongoose = require("mongoose");

const app = express();

// use ejs 
app.set('view engine', 'ejs');

// import new models 
const {Routine, Exercise} = require('./models/Routine'); 
//const Exercise = require('./models/Exercise'); 

// use body parcer 
app.use(bodyParser.urlencoded({extended:true }));
app.use(bodyParser.json()); 

//app.use(express.static("public"));// use these static elements (css, imgs etc )
//app.use(express.static('public')); // not going to use static files atm

// lets use a database
// 1) install mongoose -> npm i mongoose 
// 2) require mongoose 
// 3) connect to mongo
//mongoose.connect("mongodb://localhost:27017/ExerciseDB",{useNewUrlParser: true , useUnifiedTopology: true});
mongoose.connect("mongodb+srv://adminSaul:test123@cluster0.pyekv.mongodb.net/ExerciseDB?retryWrites=true&w=majority" , {useNewUrlParser: true , useUnifiedTopology: true}); 

// 4) create a database schema 

const itemsSchema = {
  // add a routine ID so ik which list of exercises belongs to what routine 
    routine_id: mongoose.ObjectId,
    // instead of string   
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
              // required: [true, 'name required'],
              // minlength: [2, 'name must be at least 2 characters.'],
              // maxlength: [20, 'name must be less than 20 characters.']
          }, 
  // contains an array of 'items' = exercises, sets , reps , weight 
  logs: [itemsSchema] 
};

// create a mongoose model based on the second schema 
const Log = mongoose.model("Log", logSchema);
 


  
  let openExerciseMenu;
  let openRoutineMenu; 

    let logNames =[];

app.get("/", function(req, res){

    const routineID = req.query.routineID; 
    Routine.find({},{ RoutineName:1},{_id: 0},function(err, logNamesHere){

      //console.log(logNamesHere); 

      if(!err){
       
        res.render('home',{  listofNames: logNamesHere, OpenEdit: routineID });
      }

    });


  
  });


app.post("/NewRoutine", function(req, res){

 const pageName= req.body.newpageName;

    const newRoutine =  {
      RoutineName: pageName
    }; 

    Routine.insertMany(newRoutine, function(err, insertedRoutine){

        if(!err){
          res.redirect('/displayRoutine/?routineID='+insertedRoutine[0]._id); 
        }
        else{ console.log(err) }
    }) // end of insertMany 
      
 
});

// moving my route on top of hte route that gets the query string aka /displayRoutine 
app.post("/createExercise", function(req, res){

  let exrName = req.body.newExr;

  let NumSet = req.body.setNum;


  let NumReps = req.body.repsNum;

  let wght = req.body.weight;

  const LongRoutineID = req.body.idBTN;
  // routineID is length of 25 => 25 bytes thats why I get typecast error bc find only reads 
  // 24 bytes _id

  // need to remove the first character 
  const ProperLengthID = LongRoutineID.substring(1);

   let weightDatastring =[];
   weightDatastring = wght.split(',');

  const NewExercise = { routine_id: ProperLengthID ,name: exrName, sets: NumSet, reps: NumReps , weight: weightDatastring };

  // insert new exercise 
  Exercise.insertMany(NewExercise, function(err, insertedExercise){
      if(!err){
        res.redirect('/displayRoutine/?routineID='+ProperLengthID);
      }
      else{
        console.log(err); 
      }
  }); 

});


  //
app.get('/displayRoutine', function( req, res){
 
    const RoutineID = req.query.routineID; 
    let ExerciseID = req.query.exerciseID;
   
    Routine.find({_id: RoutineID}, function(err, foundRoutine){
      if(!err){
             // find all exercises that belong to this routine 
        Exercise.find({routine_id: foundRoutine[0]._id}, function(err,foundExercises){
            if(!err){
              res.render('routine', { routine: foundRoutine, ListOfExercises : foundExercises , open: ExerciseID });
            }
        }); // end of Exercise.find()
      }
     
    }); // end of Routine.find()

      

 
}); 

app.post('/displayRoutine', function(req, res){

  const btnRoutineID = req.body.routineIDbtn;

  res.redirect('/displayRoutine/?routineID='+btnRoutineID); 
}); 


app.post("/delete", function(req, res){


  // routine id 
  const dtRoutine = req.body.deltRotn;
  // item id 
  let SetOfIds = req.body.delete;


  if ( dtRoutine != undefined){ // if not undefined then you want to delete a routine 
    Routine.deleteOne({_id: dtRoutine}, function(err){

      if( !err){
        console.log("routine deleted successfully");
    }
    
    });
   // need to delete exercise that belong to that routine 
   Exercise.deleteMany({routine_id: dtRoutine}, function(err){
      if(!err){
        console.log("deleted all exercises that belonged to the routine as well"); 
      }
   }); 

    res.redirect("/");

  }
  else {

      //console.log(SetOfIds); 
  // Need to split to get exercise ID to delete 
  var index = SetOfIds.indexOf("$");  // Gets the first index where a '$' 
  var exerciseID = SetOfIds.substr(0, index); // Gets the first part _id
  var routineID = SetOfIds.substr(index + 1);  // Gets routine_id

    Exercise.deleteOne({_id: exerciseID}, function(err){
      
      if(!err){
        console.log("exercise deleted successfully" );
        res.redirect('/displayRoutine/?routineID='+routineID); 
      }
      else{
        console.log(err); 
      }
    }); 
    
  }
});




// create a route to update item 
app.post("/update", function(req,res){

    // exercise 
    const updateItem = req.body.needsUpdate;

    // routine 
    const newRoutineName = req.body.updateRoutineName;
    const updateRoutine = req.body.updateRoutineID;
    
    if ( updateItem != undefined){// if updateItem is not undefined then user wants to update an exercise
      
    let newName = req.body.updateName;
    let newSetNum = req.body.updateSetNum;
    let newRepNum = req.body.updateRepNum;
    let newWeight= req.body.updateWeight;

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
  Exercise.updateOne({_id: updateItem},newValues,function(err) {
 
    if(!err){
        console.log("Exercise has been updated"); 
            }
  
        });
  // once exercise is updated lets redirect 
   Exercise.find({_id: updateItem}, function(err, foundItem){
      if( !err){
        res.redirect('/displayRoutine/?routineID='+foundItem[0].routine_id); 
      }
   });

  } // end of if 

  else {
    

    // if the new name is more than 2 characters  
    if( newRoutineName.length > 2){

   
    var updatedName = {
                          $set:
                              {
                                RoutineName: newRoutineName
                              }};
    Routine.updateOne({ _id : updateRoutine}, updatedName, function(err, response) {
          
          if( !err){

            console.log("item has been updated successfully for item:" );
            
          }

      });

    }
    // name is not long enough , close menu
    else { 

      openRoutineMenu = null;
    }

        res.redirect("/");

  }// end of else 

});



app.post("/openMenu", function(req, res){

   const exerciseID = req.body.editBtnExr; 
  
   const routineID = req.body.editBtnRt;
  
   if ( exerciseID != undefined){
   
       Exercise.find({_id:exerciseID}, function(err, foundItem){

          if(!err){
          res.redirect('/displayRoutine/?routineID='+foundItem[0].routine_id+'&exerciseID='+exerciseID);
          }
       })
      
   }
   else {
      res.redirect("/?routineID="+routineID);
   }


});





// close the 'edit' pop up  
app.post("/close", function(require,response){


  const closeExr = require.body.closeMenuExr; 


  const closeRt = require.body.closeMenuRt; 
  
  if ( closeExr != undefined){

    response.redirect('/displayRoutine/?routineID='+closeExr);

  }

  else{
     
    response.redirect("/");

  }
  
});

app.listen(5000,function(){
    console.log("connected to port 5000");
});
 