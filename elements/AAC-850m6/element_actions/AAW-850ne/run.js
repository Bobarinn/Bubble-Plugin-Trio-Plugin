function(instance, properties, context) {
    // Example configuration object - set these values dynamically
    const awsConfig = {
        region: properties.region, // AWS region
        accesskeyid: properties.accesskeyid, // Your AWS access key ID
        secretaccesskey: properties.secretaccesskey, // Your AWS secret access key
        sessiontoken: properties.sessiontoken // Your AWS session token (if applicable)
    };

    const bucketName = "blueshirt-backend-dev-resume-files"; // Hard coded S3 bucket name
    const userId = properties.userid; // Unique identifier for the user
    const unixTimeStamp = properties.timestamp;

    const configureAWS = (config) => {
        AWS.config.update({
            region: config.region,
            credentials: new AWS.Credentials({
                accessKeyId: config.accesskeyid,
                secretAccessKey: config.secretaccesskey,
                sessionToken: config.sessiontoken
            })
        });
    };

    configureAWS(awsConfig);

    // Function to upload a file to S3
    const uploadFileToS3 = async (file) => {
        const s3 = new AWS.S3();
        const fileName = file.name;
        const fileKey = `${userId}/${unixTimeStamp}/${fileName}`;

        const uploadParams = {
            Bucket: bucketName,
            Key: fileKey,
            Body: file
        };

        try {
            const data = await s3.upload(uploadParams).promise(); // Use promise() to make it awaitable
            console.log(`Successfully uploaded file ${fileName}: ${data.Location}`);
        } catch (err) {
            console.error(`Error uploading file ${fileName} to S3:`, err);
        }
    };

    // Upload stored files when this function is called (e.g., on "Save" button click)
    const files = instance.data.files || [];
    
    if (files.length === 0) {
        console.log('No files to upload.');
        return;
    }

    files.forEach(async (file) => {
        await uploadFileToS3(file);
    });
}
