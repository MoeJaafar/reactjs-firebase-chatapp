import React, { useRef, useState } from 'react';
import './App.css';

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/analytics';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

firebase.initializeApp({
  apiKey: "AIzaSyAIADBVmXNos6jA8IsXQ4HgV5GgCsz2FFg",
  authDomain: "realtimechatapp-b50f1.firebaseapp.com",
  projectId: "realtimechatapp-b50f1",
  storageBucket: "realtimechatapp-b50f1.appspot.com",
  messagingSenderId: "302631472166",
  appId: "1:302631472166:web:af28699829cad03cfcaae7",
  measurementId: "G-9QJNQH1SBE"
})

const auth = firebase.auth();
const firestore = firebase.firestore();


function App() {
  const [user] = useAuthState(auth);
  const [roomID, setRoomID] = useState('');
  const [, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="App">
      <header>
        <span className='title'>MoeChat</span>
        <SignOut setIsLoggedIn={setIsLoggedIn} setRoomID={setRoomID} setPassword={setPassword} />
      </header>

      <section>
        {user && roomID ? <ChatRoom roomID={roomID} /> : <SignIn setRoomID={setRoomID} setPassword={setPassword} setError={setError} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} error={error} />
        }
      </section>

    </div>
  );
}


function SignIn({ setRoomID, setPassword, setError, isLoggedIn, setIsLoggedIn, error }) {
  const [localRoomID, setLocalRoomID] = useState("");
  const [localPassword, setLocalPassword] = useState("");
  const [showRoomForm, setShowRoomForm] = useState(false);

  const signInWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
    setIsLoggedIn(true);
    setShowRoomForm(true);
  }

  const verifyRoom = async (event) => {
    event.preventDefault();

    setError('');

    if (localRoomID.trim() === "") {
      setError('Room ID cannot be empty!');
      return;
    }

    const roomRef = firestore.collection('rooms').doc(localRoomID);
    const doc = await roomRef.get();
    if (!doc.exists) {
      setError('No such room!');
      setTimeout(() => setError(''), 5000);
    } else if (doc.data().password !== localPassword) {
      setError('Wrong password!');
      setTimeout(() => setError(''), 5000);
    } else {
      setRoomID(localRoomID);
      setPassword(localPassword);
    }
  }


  const handleRoomIDChange = (event) => {
    setError('');
    setLocalRoomID(event.target.value);
  }

  const handlePasswordChange = (event) => {
    setError('');
    setLocalPassword(event.target.value);
  }

  return (
    <>
      {!isLoggedIn ? (
        <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
      ) : showRoomForm ? (
        <form onSubmit={verifyRoom} className="room-form">
          <input type="text" className="room-input" placeholder="Room ID" onChange={handleRoomIDChange} value={localRoomID} />
          <input type="password" className="room-input" placeholder="Password" onChange={handlePasswordChange} value={localPassword} />
          <button className="sign-in" type="submit">Enter Room</button>
        </form>

      ) : (

        <p className='pls'>Please enter a room ID to continue.</p>
      )}
      {error && <div className='error'>{error}</div>}
      <p className='center'>Please do not violate the community guidelines!</p>
    </>
  )
}





function SignOut({ setIsLoggedIn, setRoomID, setPassword }) {
  const signOut = () => {
    auth.signOut();
    setIsLoggedIn(false);
    setRoomID('');
    setPassword('');
  };

  return auth.currentUser && (
    <button className="button-85" onClick={signOut}>Sign Out</button>
  )
}



function ChatRoom({ roomID }) {
  const dummy = useRef();
  const messagesRef = firestore.collection('rooms').doc(roomID).collection('messages');
  const query = messagesRef.orderBy('createdAt').limit(25);

  const [messages] = useCollectionData(query, { idField: 'id' });

  const [formValue, setFormValue] = useState('');


  const sendMessage = async (e) => {
    e.preventDefault();

    const { uid, photoURL } = auth.currentUser;

    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL
    })

    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  return (<>
    <main>

      {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}

      <span ref={dummy}></span>

    </main>

    <form onSubmit={sendMessage}>

      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Message" />

      <button type="submit" disabled={!formValue}>➜</button>

    </form>
  </>)
}


function ChatMessage(props) {
  const { createdAt, text, uid, photoURL } = props.message;

  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  let timestamp = '';
  if (createdAt) {
    const date = createdAt.toDate();
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      timestamp = `Today ${date.toLocaleTimeString('en-US')}`;
    } else if (date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate() - 1) {
      timestamp = `Yesterday ${date.toLocaleTimeString('en-US')}`;
    } else {
      timestamp = date.toLocaleString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
      });
    }
  }

  return (
    <div className={`message ${messageClass}`}>
      <img alt='user' src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} />
      <p className='message-text'>
        {text}
        <span className='tooltip'>{timestamp}</span>
      </p>
    </div>
  );
}





export default App;