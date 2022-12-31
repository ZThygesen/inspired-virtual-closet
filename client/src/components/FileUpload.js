import Dropzone from "./Dropzone/Dropzone";

export default function FileUpload() {
    return (
        <div>
            <p className="file-upload-title">Drag and Drop Image Upload</p>
            <div className="content">
                <Dropzone />
            </div>
        </div>
    );  
}
