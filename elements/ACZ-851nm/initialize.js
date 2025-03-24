function(instance, context) {
    // Initialize plugin states with default values
    instance.data.selectedFiles = [];      // Array to store the selected files
    instance.data.uploadedFiles = [];      // Array to store successfully uploaded file names
    instance.data.failedFiles = [];        // Array to store failed uploads
    instance.data.uploadProgress = {};     // Object to track progress of each file
}
