
// Since objects only compare === to the same object (i.e. the same reference)
// we can do something like this instead of using integer enums because we can't
// ever accidentally compare these to other values and get a false-positive.
//
// For instance, `rejected === resolved` will be false, even though they are
// both {}.
// var rejected = {}, resolved = {}, waiting = {};


var rejected = [], resolved = [], waiting = [];


//Thoughts: promises should live in one of the three arrays; when the resolve fires,
//they are moved from the waiting to the resolved category.


// This is a promise. It's a value with an associated temporal
// status. The value might exist or might not, depending on
// the status.
// Adding context is my invention; maybe should replace status with context,
// because I do not ever use status;
var Promise = function (value, status, context) {
  var promiseObj = Object.create(Promise.prototype);
  promiseObj.catchFun = [];
  if (!context || resolved.indexOf(context) !== -1) {
    if (status === "resolved") {
      promiseObj.value = value;
      resolved.push(promiseObj); 
    } else if (status === "rejected") {
      rejected.push(promiseObj);
    } else {
      waiting.push(promiseObj);
    }
  } else {
    promiseObj.waitFun = value; //value will be a function, because of how we designed 'then' method
  } 
 
  promiseObj.waitProm = [];
  return promiseObj;
};

// The user-facing way to add functions that want
// access to the value in the promise when the promise
// is resolved.

// Here I assume that success (first argument) is a function that should fire on success;
Promise.prototype.then = function (success, _failure) {
  console.log("then", success);
  if (resolved.indexOf(this) !== -1) { //if resolved
    var newProm = Promise(success(this.value));
    return newProm;
  } else if (rejected.indexOf(this) === -1) { //if not resolved, but not rejected
    var newProm = Promise(success, "wait", this);
    this.waitProm.push(newProm);
    return newProm;
  }
};


// The user-facing way to add functions that should fire on an error. This
// can be called at the end of a long chain of .then()s to catch all .reject()
// calls that happened at any time in the .then() chain. This makes chaining
// multiple failable computations together extremely easy.
Promise.prototype.catch = function (failure) {
  this.catchFun.push(failure);
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
  var newestPromise = promiseObj.waitFun(data);  //invoke the "waiting" function, assuming that it returns a promise
  var addChildren = function (promiseNew, promiseOld) {
    if (promiseOld.waitProm.length === 0) {
      return;
    } else {
      for (var i=0; i < promiseOld.waitProm.length; i++) {
        var addThen = promiseNew.then(promiseOld.waitProm[i].waitFun); //the promise returned by application of .then method to the new promise;
        addThen.catchFun = promiseOld.waitProm[i].catchFun;
        addChildren(addThen,promiseOld.waitProm[i]);
      }
    }
  }
  addChildren(newestPromise, promiseObj);
  return newestPromise;
}

var rejectChildren = function (promiseObj, error) {
  if (promiseObj.catchFun.length > 0) {
    for (var i = 0; i < promiseObj.catchFun.length; i++) {
      console.log("Executing");
      promiseObj.catchFun[i](error);
    }
  } else {
    if (promiseObj.waitProm.length > 0) {
      for (var j = 0; j < promiseObj.waitProm.length; j++) {
        rejectChildren(promiseObj.waitProm[j], error);
      }
    }
  }
}



// Resolve the contained promise with data.
//
// This will be called by the creator of the promise when the data
// associated with the promise is ready.

Deferred.prototype.resolve = function (data) {
  for (var i = 0; i < waiting.length; i++) {
    if (waiting[i] === this.promise) {
      waiting.splice(i,1);
    };    
  }
  resolved.push(this.promise);
  this.promise.value = data; //so that it is possible to refer to this value in the future
  for (var j = 0; j < this.promise.waitProm.length; j++) {
    //waiting.push(this.promise.waitProm[i]); //add children promises to the global object;
    resolveChildren(this.promise.waitProm[j], data);
  }
};

// Reject the contained promise with an error.
//
// This will be called by the creator of the promise when there is
// an error in getting the data associated with the promise.
Deferred.prototype.reject = function (error) {
  for (var i = 0; i < waiting.length; i++) {
    if (waiting[i] === this.promise) {
      waiting.splice(i,1);
    };    
  }
  rejected.push(this.promise); //so that we know that the promise has been rejected;
  rejectChildren(this.promise, error);
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

