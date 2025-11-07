import { TipsContainer } from '../styles/Tips';

export default function Tips({ display }) {
    return (
        <TipsContainer style={{ display: display ? 'flex' : 'none' }}>
            Tips
        </TipsContainer>
    );
}
