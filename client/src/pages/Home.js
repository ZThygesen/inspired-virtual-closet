import { HomeContainer } from '../styles/Home';
import ActionButton from '../components/ActionButton'
import logo from '../images/big_logo.png';

export default function Home() {
    return (
        <HomeContainer>
            <img src={logo} alt="Edie Styles" className="big-logo" />
            
            <div className="home-options">
                <h1>Virtual Closet</h1>
                <ActionButton variant={'primary'} isLink={true} linkPath={'manage-clients'}>CLIENTS</ActionButton>
            </div>
        </HomeContainer>
    );
}
