import Dropzone from './Dropzone';
import { AddItemsContainer } from '../styles/AddItems';
import { useSidebar } from './SidebarContext';

export default function AddItems({ display, category, updateItems }) {
    const { setSidebarOpen } = useSidebar();

    return (
        <AddItemsContainer style={{ display: display ? 'flex' : 'none' }}>
            <div className="category-select">
                {
                    (category._id === -1) ?
                        <>
                            <h2 className="add-item-title error">Cannot add items to <span className="category error" onClick={() => setSidebarOpen(true)}>{category.name}</span></h2> 
                            <p className="help-info">(select a specific category you want to add items to)</p>
                        </>
                        :
                        <>
                            <h2 className="add-item-title">Add items to <span className="category" onClick={() => setSidebarOpen(true)}>{category.name}</span></h2>
                            <p className="help-info">(select the category you want to add items to from the sidebar)</p>
                        </>
                }
            </div>
            <Dropzone category={category} disabled={category._id === -1} updateItems={updateItems} />
        </AddItemsContainer>
    );
}
