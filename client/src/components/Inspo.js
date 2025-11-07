import { InspoContainer } from '../styles/Inspo';

export default function Inspo({ display }) {
    return (
        <InspoContainer style={{ display: display ? 'flex' : 'none' }}>
            Inspo
        </InspoContainer>
    );
}
