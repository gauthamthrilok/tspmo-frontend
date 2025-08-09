import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import BotConversation from './botconversation.jsx';    
import './App.css'

function App() {

  return (
    <Routes>
      <Route path="/" element={<BotConversation/>} />
    </Routes>
  );
}

export default App
