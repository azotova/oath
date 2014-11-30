
// Since objects only compare === to the same object (i.e. the same reference)
// we can do something like this instead of using integer enums because we can't
// ever accidentally compare these to other values and get a false-positive.
//
// For instance, `rejected === resolved` will be false, even though they are
// both {}.
var rejected = {}, resolved = {}, waiting = {};

// This is a promise. It's a value with an associated temporal
// status. The value might exist or might not, depending on
// the status.
var Promise = function (value, status) {
  var promiseObj = Object.create(Promise.prototype);
  /*if (status === "success") {
  	promiseObj.value = value;
  }*/
  promiseObj.resolved = [];
  promiseObj.rejected = [];
  return promiseObj;
};

// The user-facing way to add functions that want
// access to the value in the promise when the promise
// is resolved.

// Here I assume that success (first argument) is a function that should fire on success;
Promise.prototype.then = function (success, _failure) {
  /*var key = this.value;
  if (!resolved[key]) {
    resolved[key] = [];
  };
  resolved[key].push(success);*/
  this.resolved.push(success);
};


// The user-facing way to add functions that should fire on an error. This
// can be called at the end of a long chain of .then()s to catch all .reject()
// calls that happened at any time in the .then() chain. This makes chaining
// multiple failable computations together extremely easy.
Promise.prototype.catch = function (failure) {
};



// This is the object returned by defer() that manages a promise.
// It provides an interface for resolving and rejecting promises
// and also provides a way to extract the promise it contains.
var Deferred = function (promise) {
  console.log("Trying")
  obj = Object.create(Deferred.prototype);
  obj.promise = Promise("text", "success");
  return obj;
};

// Resolve the contained promise with data.
//
// This will be called by the creator of the promise when the data
// associated with the promise is ready.
Deferred.prototype.resolve = function (data) {
  /*var key = this.promise.value;
  if (resolved[key]) {
      for (var i = 0; i < resolved[key].length; i++) {
        console.log("res", resolved);
        resolved[key][i](data);
      }     
    }*/
 // this.promise.then(data);
  if (this.promise.resolved.length > 0) {
    for (var i = 0; i < this.promise.resolved.length; i++) {
      console.log("res", resolved);
      this.promise.resolved[i](data);
    }
  }
};

// Reject the contained promise with an error.
//
// This will be called by the creator of the promise when there is
// an error in getting the data associated with the promise.
Deferred.prototype.reject = function (error) {
};

// The external interface for creating promises
// and resolving them. This returns a Deferred
// object with an empty promise.
var defer = function () {
  console.log("starting")
  var DeferredObj = Deferred();
  console.log("Deferred", DeferredObj);
  return DeferredObj;
};


module.exports.defer = defer;

