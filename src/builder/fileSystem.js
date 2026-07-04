const fs = require("fs");
const path = require("path");

function read(file) {
    return fs.readFileSync(path.resolve(file), "utf8");
}

function write(file, content) {
    fs.writeFileSync(path.resolve(file), content, "utf8");
}

function exists(file) {
    return fs.existsSync(path.resolve(file));
}

module.exports = {
    read,
    write,
    exists
};
