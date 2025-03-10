import { InPersonStylingContainer } from '../styles/InPersonStyling';
import ReactGoogleSlides from 'react-google-slides';
 
export default function InPersonStyling({ display }) {
    return (
        
        <InPersonStylingContainer style={{ display: display ? 'flex' : 'none' }}>
            In Person Styling
            {/* <a href="https://docs.google.com/presentation/d/1cRQsH6vrgGXfPXFUzHwc-IvhICHLKkW0kawJVveEtI4/edit?usp=sharing">
                <ReactGoogleSlides
                    width={640}
                    height={480}
                    slidesLink="https://docs.google.com/presentation/d/1cRQsH6vrgGXfPXFUzHwc-IvhICHLKkW0kawJVveEtI4/edit?usp=sharing"
                    slideDuration={5}
                    position={1}
                    showControls
                    loop
                />
            </a> */}
        </InPersonStylingContainer>
        
    );
}