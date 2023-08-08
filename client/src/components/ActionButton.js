import { ActionButton as Button, ActionButtonLink as Link } from '../styles/ActionButton';

export default function ActionButton({ variant, isLink, linkPath, onClick, children }) {
    
    return (
        isLink ?
            <Link to={linkPath} className={variant}>
                {children}
            </Link>
            :
            <Button className={variant} onClick={onClick}>
                {children}
            </Button>
        
    );
}
