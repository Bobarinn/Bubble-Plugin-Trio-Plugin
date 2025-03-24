function(instance, properties, context) {
    if (instance.data.isFileDialogOpen) return;
    instance.data.isFileDialogOpen = true;

    var input = document.createElement("input");
    input.setAttribute('type', 'file');
    input.setAttribute('multiple', '');

    input.addEventListener('change', async function(ev) {
        const maxSize = 3 * 1024 * 1024; // 3MB limit
        const files = Array.from(ev.target.files);
        
        // Filter files that are within the 3MB size limit
        const validFiles = files.filter(file => file.size <= maxSize);
        const invalidFiles = files.filter(file => file.size > maxSize);

        if (invalidFiles.length > 0) {
            alert(`Some files were too large and were not selected. Max file size allowed: 3MB.`);
        }

        if (validFiles.length === 0) {
            instance.data.isFileDialogOpen = false;
            document.body.removeChild(input);
            return;
        }

        const fileUrls = validFiles.map(file => URL.createObjectURL(file));
        window.fileData = validFiles; // Store only valid files

        instance.publishState('selected_files', fileUrls);
        instance.publishState('file_names', validFiles.map(f => f.name));
        instance.publishState('file_types', validFiles.map(f => f.type));
        instance.publishState('selected_files_count', validFiles.length); // Update file count
        instance.triggerEvent('file_selected');

        document.body.removeChild(input);
        instance.data.isFileDialogOpen = false;
    });

    document.body.appendChild(input);
    setTimeout(() => input.click(), 100);
}
