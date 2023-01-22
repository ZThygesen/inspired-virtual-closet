import styled from 'styled-components';
import { Tooltip } from '@mui/material';
import { Delete, Edit, Shortcut, SwapVert } from '@mui/icons-material';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: var(--box-shadow);
    padding: 20px;
    border-radius: 25px;
    max-width: 250px;
    word-wrap: break-word;

    p {
        font-size: 32px;
        color: var(--black);

    }

    img {
        width: 250px;
        height: auto;
    }

    .item-options {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 5px 0 15px 0;
    }

    .item-option {
        padding: 5px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.1s;
        color: #a7a7a7;

        &:hover {
            background-color: rgba(0, 0, 0, 0.1);
            color: var(--black);
        }
    }

    .item-option.important {
        color: var(--secondary);
    }
`;

export default function ClothingCard({ item }) {
    return (
        <Container>
            <p>{item.fileName}</p>
            <img src={item.fileUrl} alt={item.fileName} />
            <div className="item-options">
                <Tooltip title="Send to Canvas">
                    <Shortcut
                        className="item-option important"
                        sx={{ fontSize: 45 }}
                    />
                </Tooltip>
                <Tooltip title="Change Category">
                    <SwapVert
                        className="item-option"
                        sx={{ fontSize: 45 }}
                    />
                </Tooltip>
                <Tooltip title="Edit">
                    <Edit
                        className="item-option"
                        sx={{ fontSize: 45 }}
                    />
                </Tooltip>
                <Tooltip title="Delete">
                    <Delete
                        className="item-option"
                        sx={{ fontSize: 45 }}
                    />
                </Tooltip>
            </div>
        </Container>
    );
}
