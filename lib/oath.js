
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
  console.log("value", value);
  var promiseObj = Object.create(Promise.prototype);
  /*if (status === "success") {
  	promiseObj.value = value;
  }*/
  //promiseObj.resolved = [];
    promiseObj.rejected = [];
   if (arguments.length>1) {
    console.log("here");
    promiseObj.value = value;
   }
   console.log("promRes", promiseObj);
  return promiseObj;
};

// The user-facing way to add functions that want
// access to the value in the promise when the promise
// is resolved.

// Here I assume that success (first argument) is a function that should fire on success;
Promise.prototype.then = function (success, _failure) {
  console.log("this", this, this.value);
  if (this.value) {
    var key = "nexty";
    console.log("key", key);
    if (!waiting[key]) {
      waiting[key] = [];
    };
    waiting[key].push(success); //this success will eventually become "step 3";
    // Trying to create waiting = {succ: step2, step2: step3} ;
    // when step 2 is executed, we need to fire step3 with this value;
    console.log("waiting", waiting, success);
  } else {
    if (!waiting.succ) {
      waiting.succ = [];
    }
    waiting.succ.push(success);
    console.log("waiting1", waiting, success);
  }
  var newV = Deferred(Promise("nexty", "success")); //sucess is Step2 in our case
  console.log("newV", newV.promise)
  return newV.promise;
};


// The user-facing way to add functions that should fire on an error. This
// can be called at the end of a long chain of .then()s to catch all .reject()
// calls that happened at any time in the .then() chain. This makes chaining
// multiple failable computations together extremely easy.
Promise.prototype.catch = function (failure) {
  this.rejected.push(failure);
};



// This is the object returned by defer() that manages a promise.
// It provides an interface for resolving and rejecting promises
// and also provides a way to extract the promise it contains.
var Deferred = function (promise) {
  console.log("defProm", promise);
  promise = promise || Promise();
  obj = Object.create(Deferred.prototype);
  obj.promise = promise;
  return obj;
};

// Resolve the contained promise with data.
//
// This will be called by the creator of the promise when the data
// associated with the promise is ready.
Deferred.prototype.resolve = function (data) {
 // this.promise.then(data);
  if (waiting.nexty && waiting.nexty.length > 0) {
    var len = waiting.nexty.length;
    for (var i = 0; i < len; i++) {
      waiting.nexty[i](data);
    }
    delete waiting.nexty;
  } else if (waiting.succ && waiting.succ.length > 0) {
    var len = waiting.succ.length;
    for (var i = 0; i < len; i++) {
      waiting.succ[i](data);
      waiting.succ.splice(i,1);
    }
  }
};

// Reject the contained promise with an error.
//
// This will be called by the creator of the promise when there is
// an error in getting the data associated with the promise.
Deferred.prototype.reject = function (error) {
  if (this.promise.rejected.length > 0) {
    for (var i = 0; i < this.promise.rejected.length; i++) {
      this.promise.rejected[i](error);
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

