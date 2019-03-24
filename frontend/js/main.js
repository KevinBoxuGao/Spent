$(function(){
  // This is the host for the backend.
  // TODO: When running Firenotes locally, set to http://localhost:8081. Before
  // deploying the application to a live production environment, change to
  // https://backend-dot-<PROJECT_ID>.appspot.com as specified in the
  // backend's app.yaml file.
  var backendHostUrl = 'https://backend-dot-spentweb.appspot.com';
  //var backendHostUrl = 'http://localhost:8081';

  // [START gae_python_firenotes_config]
  // Obtain the following from the "Add Firebase to your web app" dialogue
  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyBqe0kXeMXXaNaL6J5DtobpqsMK8vW3GM4",
    authDomain: "spentweb.firebaseapp.com",
    databaseURL: "https://spentweb.firebaseio.com",
    projectId: "spentweb",
    storageBucket: "",
    messagingSenderId: "714905223411"
  };
  // [END gae_python_firenotes_config]

  // This is passed into the backend to authenticate the user.
  var userIdToken = null;

  // Firebase log-in
  function configureFirebaseLogin() {

    firebase.initializeApp(config);

    // [START gae_python_state_change]
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        $('#logged-out').hide();
        var name = user.displayName;

        /* If the provider gives a display name, use the name for the
        personal welcome message. Otherwise, use the user's email. */
        var welcomeName = name ? name : user.email;

        user.getToken().then(function(idToken) {
          userIdToken = idToken;

          /* Now that the user is authenicated, fetch the notes. */
          register();

          $('#user').text(welcomeName);
          $('#logged-in').show();

        });

      } else {
        $('#logged-in').hide();
        $('#logged-out').show();

      }
    // [END gae_python_state_change]

    });

  }

  // [START configureFirebaseLoginWidget]
  // Firebase log-in widget
  function configureFirebaseLoginWidget() {
    var uiConfig = {
      'signInSuccessUrl': '/',
      'signInOptions': [
        // Leave the lines as is for the providers you want to offer your users.
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID
      ],
      // Terms of service url
      'tosUrl': '<your-tos-url>',
    };

    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    ui.start('#firebaseui-auth-container', uiConfig);
  }
  // [END gae_python_firebase_login]

  // [START gae_python_fetch_notes]
  // Fetch notes from the backend.
  function getTransactions() {
    $.ajax(backendHostUrl + '/accountdata', {
      /* Set header for the XMLHttpRequest to get data from the web server
      associated with userIdToken */
      headers: {
        'Authorization': 'Bearer ' + userIdToken
      }
    }).then(function(data){
      $('#transactionsdiv').empty();
      $('#transactionsdiv').append(data[1]);
      $('#amount-total24h').empty();
      $('#amount-total24h').append(data[0][0]);
      $('#amount-total7d').empty();
      $('#amount-total7d').append(data[0][1]);
      $('#amount-total30d').empty();
      $('#amount-total30d').append(data[0][2]);
      $('#amount-totalallt').empty();
      $('#amount-totalallt').append(data[0][3]);
    });
  }

  function register() {

    $.ajax(backendHostUrl + '/register', {
      headers: {
        'Authorization': 'Bearer ' + userIdToken
      },
      method: 'POST',
      data: JSON.stringify({'empty' : 'header'}),
      contentType : 'application/json'
    }).then(function(){
      getTransactions();
    });
  }
  // [END gae_python_fetch_notes]

  // Sign out a user
  var signOutBtn =$('#sign-out');
  signOutBtn.click(function(event) {
    event.preventDefault();

    firebase.auth().signOut().then(function() {
      console.log("Sign out successful");
    }, function(error) {
      console.log(error);
    });
  });

  // Save a note to the backend
  var saveNoteBtn = $('#add-note');
  saveNoteBtn.click(function(event) {
    event.preventDefault();

    var amountField = $('#Amount');
    var amount = amountField.val();
    amountField.val("");

    var detailsField = $('#Details');
    var details = detailsField.val();
    detailsField.val("");

    /* Send note data to backend, storing in database with existing data
    associated with userIdToken */
    $.ajax(backendHostUrl + '/accountdata', {
      headers: {
        'Authorization': 'Bearer ' + userIdToken
      },
      method: 'POST',
      data: JSON.stringify({'expense1' : amount, 'expense2' : details}),
      contentType : 'application/json'
    }).then(function(){
      getTransactions();
    });

  });

  configureFirebaseLogin();
  configureFirebaseLoginWidget();

});
