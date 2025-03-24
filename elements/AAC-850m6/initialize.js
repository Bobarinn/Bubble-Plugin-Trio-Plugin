function(instance, context) {
    // Initialize arrays to store file information
    instance.data.base64 = [];         // To store base64 encoded file data
    instance.data.extensions = [];     // To store file extensions
    instance.data.names = [];          // To store file names
    instance.data.size = [];           // To store file sizes
    instance.data.size_type = [];      // To store file names that exceed size/type limits
    instance.data.type = [];           // To store file types
    instance.data.limit = [];          // To store file names that exceed the limit
    instance.data.file_size = [];      // To store file sizes in bytes
    instance.data.files = [];          // To store the actual File objects
}
