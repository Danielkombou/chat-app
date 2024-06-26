import React, { useContext, useState } from 'react';
import { UserContext } from './UserContext';
import axios from 'axios'



function RegisterAndLoginForm() {

  const [username, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [isLoginOrRegister, setIsLoginOrRegister] = useState('register')
  const {setUserName:setLoggedInUserName, setId} = useContext(UserContext);

  async function handleSubmit (ev) {
    ev.preventDefault();
    const url = isLoginOrRegister === 'register' ? 'register' : 'login';
    const { data } = await axios.post(url, {username, password});
    setLoggedInUserName(username);
    setId(data.id);
  }

  return (
    <div className='bg-blue-50 h-screen flex items-center' >
        <form action="" className='w-64 mx-auto mb-12' onSubmit={handleSubmit} >
            <input 
            value={username}
            onChange={ev => setUserName(ev.target.value)}
            type="text" 
            placeholder='Username' 
            className='block w-full rounded-sm p-2 mb-2 border' />
            <input 
            value={password}
            onChange={ev => setPassword(ev.target.value)}
            type="password" 
            placeholder='Password' 
            className='block w-full rounded-sm p-2 mb-2 border' />
            <button className='bg-blue-500 text-white block w-full rounded-sm p-2'>
              {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
              
            </button>
            <div className='text-center mt-2'>
                {isLoginOrRegister === 'register' && (
                  <div>
                    Already a member? <button className='text-sm text-teal-500 ml-1' onClick={() => setIsLoginOrRegister('login')}>
                    Login here!
                    </button>
                  </div>
                )}
                {isLoginOrRegister === 'login' && (
                  <div>
                    Don't have an account. <button className='text-sm text-teal-500 ml-1' onClick={() => setIsLoginOrRegister('register')}>
                    Register here!
                    </button>
                  </div>
                )}
            </div>
        </form>
    </div>
  )
}

export default RegisterAndLoginForm;