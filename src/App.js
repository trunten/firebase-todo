import { useRef, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { getFirestore, collection, doc, addDoc, setDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
// import { getAnalytics, logEvent } from "firebase/analytics"; // for google analytics

const firebaseConfig = {
  apiKey: "AIzaSyA9KlAf-o1doYMxSygc36jYYluctUj0mck",
  authDomain: "todo-de4d9.firebaseapp.com",
  projectId: "todo-de4d9",
  storageBucket: "todo-de4d9.appspot.com",
  messagingSenderId: "590104396969",
  appId: "1:590104396969:web:ba8dd76e00606e446995b8",
  measurementId: "G-N1XZXJZJPJ"
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // for google analytics
const auth = getAuth(app);
const db = getFirestore();

const collectionID = "todos"

export default function App() {
  const [user, loading] = useAuthState(auth);
  return (
    <div className="App" style={{width:"100%", maxWidth:"1000px", margin:"0 auto", padding:"20px"}}>
      {!loading && <SignIn />}
      {!loading && user && <TodoList />}
    </div>
  );
}

function SignIn() {
  const [user] = useAuthState(auth);

  function googleSignIn() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
    // logEvent(analytics, 'notification_received'); // for google analytics
  }

  return (
    !user 
    ? <button onClick={googleSignIn}>Sign In</button>
    : <button onClick={()=> auth.signOut()}>Sign Out</button>
  )
}

function TodoList() {
  const { uid, photoURL } = auth.currentUser;
  const messagesCollection = collection(db, collectionID);

  const q = query(messagesCollection, where("uid", "==", uid), orderBy("createdAt"));
  const [todos] = useCollectionData(q, { idField: "id" });
  const todoText = useRef(0);
  const [hideComplete, setHideComplete] = useState(true);
  const flex = {display:"flex", alignItems:"center", gap:"10px"}

  async function submit(e) {
    e.preventDefault();
    const text = todoText.current.value;
    await addDoc(messagesCollection, { uid, text, createdAt: serverTimestamp(), complete: false });
    todoText.current.value = "";
  }

  async function completed(id) {
    const ref = doc(db, collectionID, id);
    await setDoc(ref, { complete: true }, { merge: true });
  }

  async function deleteTodo(id) {
    const ref = doc(db, collectionID, id);
    await deleteDoc(ref);
  }

  return (
    <main>
      <div style={{...flex, justifyContent:"center", marginBlock:"30px"}}>
        <img src={photoURL} alt="" style={{width:"50px", borderRadius:"50%"}} />
        <h1 style={{margin:"0"}}>Todos</h1>
      </div>
      <form onSubmit={submit} style={flex}>
        <input ref={todoText} type="text" required placeholder="I need to..." />
        <button type="submit" style={{width:"200px"}}>Submit</button>
      </form>
      <ul style={{borderBottom:"1px solid grey", padding: 0}}>
        {
          todos && todos.map(todo => {
            return (
              todo.complete && hideComplete 
              ? "" 
              : <div key={todo.id} style={{...flex, paddingBlock: "20px", borderTop:"1px solid grey"}}>
                  <li style={{...flex, width:"100%", color: todo.complete ? "grey": "inherit"}}>{todo.text}</li>
                  {todo.complete ? <div style={{minWidth:"150px"}}></div> : <button onClick={()=>completed(todo.id)} style={{maxWidth:"150px",margin:0, backgroundColor:"green"}}>Complete</button>}
                  <button onClick={()=>deleteTodo(todo.id)} style={{maxWidth:"150px", margin:0, backgroundColor:"red"}}>Delete</button>
                </div>
            )
          })
        }
      </ul>
      <button onClick={()=>setHideComplete(!hideComplete)} style={{width:"200px"}}>{hideComplete ? "Show completed" : "Hide completed"}</button>
    </main>
  )
}