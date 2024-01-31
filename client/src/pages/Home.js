import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useError } from '../components/ErrorContext';
import axios from 'axios';
import { HomeContainer } from '../styles/Home';
import ActionButton from '../components/ActionButton'
import logo from '../images/big_logo.png';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Loading from '../components/Loading';

export default function Home() {
    const { setError } = useError();
    
    const [loginOpen, setLoginOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [incorrect, setIncorrect] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    function handleLoginOpen() {
        setLoginOpen(true);
    }

    function handleLoginClose() {
        setLoginOpen(false);
        setPassword('');
    }

    async function handleSubmitLogin(e) {
        e.preventDefault();
        setLoading(true);

        setTimeout(async () => {
            try {
                const response = await axios.post('/password', { password: password });
                if (response.data) {
                    navigate('clients');
                } else {
                    setIncorrect(true);
                }
            } catch (err) {
                setError({
                    message: 'There was an error fetching the password.',
                    status: err.response.status
                });
            } finally {
                setLoading(false);
            }
        }, 350);
    }

    return (
        <>
            <HomeContainer>
                <img src={logo} alt="Edie Styles" className="big-logo" />
                <div className="home-options">
                    <h1>Virtual Closet</h1>
                    <ActionButton variant={'primary'} onClick={handleLoginOpen}>Log In</ActionButton>
                </div>
            </HomeContainer>
            <Modal
                open={loginOpen}
                closeFn={handleLoginClose}
                isForm={true}
                submitFn={handleSubmitLogin}
            >
                <div className="modal-title">LOG IN</div>
                <div className="modal-content">
                    {
                        incorrect ? 
                            <p className="medium warning">Incorrect password!</p>
                            :
                            <p className="medium">Enter password to log in.</p>
                    }
                    <Input 
                        type="text"
                        id="password"
                        label="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>
                <div className="modal-options">
                    <button type="button" onClick={handleLoginClose}>Cancel</button>
                    <button type="submit">Log In</button>
                </div>
            </Modal>
            <Loading open={loading} />
        </>
    );
}
