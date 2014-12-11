
// Since objects only compare === to the same object (i.e. the same reference)
// we can do something like this instead of using integer enums because we can't
// ever accidentally compare these to other values and get a false-positive.
//
// For instance, `rejected === resolved` will be false, even though they are
// both {}.
// var rejected = {}, resolved = {}, waiting = {};


var rejected = [], resolved = [], waiting = {};

waiting.promises = [];
//waiting.futurePromises = [];

//Thoughts: promises should live in one of the three arrays; when the resolve fires,



// This is a promise. It's a value with an associated temporal
// status. The value might exist or might not, depending on
// the status.
var Promise = function (value, status, context) {
  var promiseObj = Object.create(Promise.prototype);
  if (!context || resolved.indexOf(context) !== -1) {
    if (status === "resolved") {
      promiseObj.value = value;
      resolved.push(promiseObj); 
    } else if (status === "rejected") {
      rejected.push(promiseObj);
    } else {
      waiting.promises.push(promiseObj);
    }
  } else {
    promiseObj.waitFun = value; //value will be a function, because of how we designed 'then' method
  //  context.waitProm.push(promiseObj); //context will be a parent promiseObj, because of how we designed 'then' method
    //this statement is not needed, because we push in "then" method;
  } 
  
 // promiseObj.waitFunc = [];  
  promiseObj.waitProm = [];
  //promiseObj.resolved = [];
   // promiseObj.rejected = [];
  // if (arguments.length>1) {
  //   promiseObj.value = value;
  // }
  return promiseObj;
};

// The user-facing way to add functions that want
// access to the value in the promise when the promise
// is resolved.

// Here I assume that success (first argument) is a function that should fire on success;
Promise.prototype.then = function (success, _failure) {
  if (resolved.indexOf(this) !== -1) { //if resolved
    var newProm = Promise(success(this.value));
    return newProm;
  } else if (rejected.indexOf(this) === -1) { //if not resolved, but not rejected
    var newProm = Promise(success, "wait", this);
    this.waitProm.push(newProm);
    return newProm;
  }
};



  /*if (this.value) {
    //var key = "succ";
    if (!waiting[this.value].succ) {
      waiting[this.value].succ = {}
      waiting[this.value].succ[this.ind] = [];
    };
    waiting[this.value].succ[this.ind].push(success); //this success will eventually become "step 3";
    // Trying to create waiting = {succ: [step2, succ: step3]} (second succ is a property of array as an object);
    // when step 2 is executed, we need to fire step3 with this value;
  } else {
    if (!waiting[this.ind]) {
      waiting[this.ind] = [];
    }
    waiting[this.ind].push(success);
  }
  console.log("waiting", waiting);
  var newV = Deferred(Promise(this.ind, "success")); //sucess is Step2 in our case
  return newV.promise;
};*/


// The user-facing way to add functions that should fire on an error. This
// can be called at the end of a long chain of .then()s to catch all .reject()
// calls that happened at any time in the .then() chain. This makes chaining
// multiple failable computations together extremely easy.
Promise.prototype.catch = function (failure) {
  if (!rejected.fail) {
      rejected.fail = [];
    }
    rejected.fail.push(failure);
};



// This is the object returned by defer() that manages a promise.
// It provides an interface for resolving and rejecting promises
// and also provides a way to extract the promise it contains.
var Deferred = function (promise) {
  promise = promise || Promise();
  obj = Object.create(Deferred.prototype);
  obj.promise = promise;
  return obj;
};

var resolveChildren = function (promiseObj, data) {
  var newestPromise = waitFun(data);
  var addChilren = function (promiseNew, promiseOld) {
    if (promiseOld.waitProm.length === 0) {
      return;
    } else {
      for (var i=0; i < promiseOld.waitProm.length; i++) {
        var addThen = promiseNew.then(promiseOld.waitProm[i].waitFun); //the promise returned by application of then method to the new promise;
        addChildren(addThen,promiseOld.waitProm[i]);
      }
    }
  }
  addChilren(newestPromise, promiseObj);
  return newestPromise;
}


// Resolve the contained promise with data.
//
// This will be called by the creator of the promise when the data
// associated with the promise is ready.
//trying to pass in the second argument (to resolve the right function in the waiting array)
Deferred.prototype.resolve = function (data) {
  for (var i = 0; i < waiting.promises.length; i++) {
    if (waiting.promises[i] === this.promise) {
      waiting.promises.splice(i,1);
    };    
  }
  resolved.push(this.promise);
  this.promise.value = data; //so that it is possible to refer to this value in the future
  for (var j = 0; j < this.promise.waitProm.length; j++) {
    //waiting.promises.push(this.promise.waitProm[i]); //add children promises to the global object;
    exports.resolveChildren(this.promise.waitProm[i], data);
  }



  /*if (waiting[index] && waiting[index].length > 0) {
    var len = waiting[index].length;
    for (var i = 0; i < len; i++) {
      waiting[index][i](data);
      waiting[index].splice(i,1);
    }
    for (key in waiting[waiting[index].succ]) {
      console.log("2ndtier")
      waiting[key] = waiting[index].succ[this.ind];
    }
  }
  console.log("waitResolve", waiting);*/
};

// Reject the contained promise with an error.
//
// This will be called by the creator of the promise when there is
// an error in getting the data associated with the promise.
Deferred.prototype.reject = function (error) {
  if (rejected.fail && rejected.fail.length > 0) {
    var len = rejected.fail.length;
    for (var i = 0; i < len; i++) {
      rejected.fail[i](error);
      rejected.fail.splice(i,1);
    }
  }
};

// The external interface for creating promises
// and resolving them. This returns a Deferred
// object with an empty promise.
var defer = function () {
  var DeferredObj = Deferred();
  return DeferredObj;
};

var promisify = function (func) {
  return function () {
    var deferred = exports.defer();
    var args = Array.prototype.slice.call(arguments,0);
    var callback = function (err, data) {
      if (err) deferred.reject(err) // rejects the promise with `err` as the reason
      else deferred.resolve(data) // fulfills the promise with `data` as the value
    }
    var argsNew = args.concat([callback]);
    func.apply(this, argsNew);
    return deferred.promise
  }
}


module.exports.defer = defer;
module.exports.promisify = promisify;

