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

  return (
    <div className="App">
      <header>
        <span className='title'>MoeChat</span>
        <SignOut />
      </header>

      <section>
        {user ? <ChatRoom /> : <SignIn />}
      </section>

    </div>
  );
}

function SignIn() {

  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
      <p className='center'>Please do not violate the community guidelines!</p>
    </>
  )

}

function SignOut() {
  return auth.currentUser && (
    <button className="button-85" onClick={() => auth.signOut()}>Sign Out</button>
  )
}


function ChatRoom() {
  const dummy = useRef();
  const messagesRef = firestore.collection('messages');
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