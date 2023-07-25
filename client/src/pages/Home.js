import { Link } from 'react-router-dom';
import { HomeContainer } from '../styles/Home';
import logo from '../images/big_logo.png';

export default function Home() {
    return (
        <HomeContainer>
            <img src={logo} alt="Edie Styles Logo" className="big-logo" />
            
            <div className="home-options">
                <h1>Digital Closet</h1>
                <Link to="manage-clients">MANAGE CLIENTS</Link>
            </div>
        </HomeContainer>
    );
}
