function(instance, properties, context) {
    // Clear instance data arrays
    instance.data.files = [];
    instance.data.s3Urls = [];
    instance.data.size_type = [];
    instance.data.type = [];
    instance.data.size = [];
    instance.data.limit = [];
    instance.data.extensions = [];

    // Clear the states
    instance.publishState('files', []);
    instance.publishState('s3_urls', []);
    instance.publishState('size_type', []);
    instance.publishState('type', []);
    instance.publishState('size', []);
    instance.publishState('limit', []);
    instance.publishState('names', []);
    instance.publishState('uploaded_files_count', 0);
    instance.publishState('uploaded', false);
    instance.publishState('error', '');
    instance.publishState('selected_files_count', 0);
    instance.publishState('final_files_count', 0);
}
