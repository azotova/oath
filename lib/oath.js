
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
  //promiseObj.resolved = [];
   // promiseObj.rejected = [];
  if (arguments.length>1) {
    promiseObj.value = value;
  }
  return promiseObj;
};

// The user-facing way to add functions that want
// access to the value in the promise when the promise
// is resolved.

// Here I assume that success (first argument) is a function that should fire on success;
Promise.prototype.then = function (success, _failure) {
  if (this.value) {
    var key = "succ";
    if (!waiting.succ[key]) {
      waiting.succ[key] = [];
    };
    waiting.succ[key].push(success); //this success will eventually become "step 3";
    // Trying to create waiting = {succ: [step2, succ: step3]} (second succ is a property of array as an object);
    // when step 2 is executed, we need to fire step3 with this value;
  } else {
    if (!waiting.succ) {
      waiting.succ = [];
    }
    waiting.succ.push(success);
  }
  var newV = Deferred(Promise("nexty", "success")); //sucess is Step2 in our case
  return newV.promise;
};


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

// Resolve the contained promise with data.
//
// This will be called by the creator of the promise when the data
// associated with the promise is ready.
//trying to pass in the second argument (to resolve the right function in the waiting array)
Deferred.prototype.resolve = function (data, sec) {
  if (waiting.succ && waiting.succ.length > 0) {
    var len = waiting.succ.length;
    for (var i = 0; i < len; i++) {
      waiting.succ[i](data);
      waiting.succ.splice(i,1);
    }
    waiting.succ = waiting.succ.succ;
  }
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


module.exports.defer = defer;

