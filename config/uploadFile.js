const { Storage } = require('@google-cloud/storage')

// Initialize storage
const storage = new Storage({
    keyFilename: './gcloud/service-account-key.json',
})

const bucketName = 'gambara'
const bucket = storage.bucket(bucketName)

function uploadImg(source, fileName) {
    bucket.upload(
        source,
        {
            destination: `Balimate/${fileName}`,
        },
        function (err, file) {
            if (err) {
                console.error(`Error uploading image ${fileName}: ${err}`)
            } else {
                console.log(`Image ${fileName} uploaded to ${bucketName}.`)
            }
        }
    )
}

module.exports = uploadImg