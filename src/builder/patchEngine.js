const { read, write, exists } = require("./fileSystem");

function applyPatch(file, transform) {
    if (!exists(file)) {
        throw new Error(`File not found: ${file}`);
    }

    const original = read(file);
    const updated = transform(original);

    if (updated === original) {
        return {
            changed: false,
            file
        };
    }

    write(file, updated);

    return {
        changed: true,
        file
    };
}

module.exports = {
    applyPatch
};
