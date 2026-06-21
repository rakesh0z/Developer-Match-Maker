import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Dashboard from './Dashboard'
import IssuesDashboard from './IssuesDashboard'




function Home() {
  return (
    <>
      <section id='center'>
        <div className='hero'>
          <img src='/src/assets/hero.png' className='base' width='170' height='179' alt='' />
          <img src='/src/assets/react.svg' className='framework' alt='React logo' />
          <img src='/src/assets/vite.svg' className='vite' alt='Vite logo' />
        </div>
        <div>
          <h1>Login with GitHub</h1>
          <p>Click the button below to authenticate using GitHub and return to the app.</p>
        </div>
        <a className='counter' href='http://localhost:5000/api/auth/github'>
          Login With GitHub
        </a>
      </section>

      <section id='next-steps'>
        <div id='docs'>
          <h2>Getting started</h2>
          <p>Use the GitHub login button above to begin auth.</p>
        </div>
      </section>
    </>
  )
}



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/issues' element={<IssuesDashboard />} />


      </Routes>
    </BrowserRouter>
  )
}

export default App
