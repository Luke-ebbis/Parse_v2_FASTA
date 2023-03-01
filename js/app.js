const loadingEl = document.getElementById('loading-overlay');
const loadingTextEl = document.getElementById('loading-text');
const inputFileEl = document.getElementById('input-file');
const proteomeNameEl = document.getElementById('proteome-name');
const submitEl = document.getElementById('submit');

const proteins = [];

const partA = new PartA();
const partB = new PartB();

var filename = '';

function displayCharts() {
    partA.display(proteins, filename);
    partB.display(proteins, filename);
}

function processProteinSequence(sequence, id) {
    var idParts = id.split('|');
    var UniProtID = '';
    var GeneID = '';
    var Protein = '';

    if (idParts.length >= 3) {
        UniProtID = idParts[1];
        var id2Parts = idParts[2].split(' ');
        if (id2Parts.length > 1) {
            GeneID = id2Parts[0];
            id2Parts = id2Parts.splice(1);
            id2PartsString = id2Parts.join(' ');

            var proteinParts = id2PartsString.split("OS");
            if (proteinParts.length > 1) {
                Protein = proteinParts[0].trim();
            }
        }
    }

    var parseResult = parse(sequence, WINDOW_SIZE, REGION_LENGTH, CUTOFF);

    if (parseResult.error) {
        console.log(parseResult.message);
        console.log(id);
    } else {
        proteins.push({
            id: id,
            idData: {
                UnitProtId: UniProtID,
                GeneID: GeneID,
                Protein: Protein,
            },
            sequence: parseResult.data.sequence,
            regions: parseResult.data.regions,
            residues: parseResult.data.residues,
        });
    }
}

function parseFile(data) {
    var proteinsText = data.split(/^(?:>)/gm).filter(x => x);

    var i = 0;
    const interval = setInterval(() => {
        const proteinText = proteinsText[i];
        if (proteinText.length > 0) {
            var proteinLines = proteinText.split(/(?:\r\n|\n)+/g);
            var proteinId = proteinLines[0];
            var sequenceLines = proteinLines.splice(1);
            var sequence = sequenceLines.join('');
            loadingTextEl.innerText = `Parsing protein ${i + 1}/${proteinsText.length}...`;
            processProteinSequence(sequence, proteinId);
        }

        i++;
        if (i >= proteinsText.length) {
            clearInterval(interval);
            if (proteins.length != proteinsText.length) {
                alert(`Could not parse ${proteinsText.length - proteins.length} sequences`);
            }
            console.log(`Parsed ${proteins.length} proteins`);
            document.body.classList.remove('loading');
            displayCharts();
        }
    });

    // proteinsText.forEach((x) => {
    //     if (x.length > 0) {
    //         var proteinLines = x.split(/(?:\r\n|\n)+/g);
    //         var proteinId = proteinLines[0];
    //         var sequenceLines = proteinLines.splice(1);
    //         var sequence = sequenceLines.join('');
    //         loadingTextEl.innerText = `Parsing protein ${proteinsParsed + 1}/${proteinsText.length}...`;
    //         processProteinSequence(sequence, proteinId);
    //     }
    //     proteinsParsed++;
    // });
    return proteinsText.length;
}

function handleFile(file) {
    loadingTextEl.innerText = 'Loading file...';
    const fileReader = new FileReader();
    fileReader.addEventListener('load', (event) => {
        var data = fileReader.result;
        if (file.type == 'application/x-gzip') {
            loadingTextEl.innerText = 'Decompressing file...';
            try {
                data = pako.inflate(data);
                var textDecoder = new TextDecoder();
                data = textDecoder.decode(data);
            } catch (err) {
                console.log(err);
                alert('Could not decompress file');
                return;
            }
        }
        proteins.length = 0;
        parseFile(data);
    });
    if (file.type == 'application/x-gzip') {
        fileReader.readAsArrayBuffer(file);
    } else {
        fileReader.readAsText(file);
    }
}

function submit() {
    loadingTextEl.innerText = 'Loading...';
    document.body.classList.add('loading');
    var files = inputFileEl.files;
    if (files.length < 1) {
        alert('Select a fasta file to parse');
        return;
    }

    const file = files[0];
    filename = proteomeNameEl.value || file.name;
    handleFile(file);
}

function reset() {
    partA.reset();
    partB.reset();
}

submitEl.addEventListener('click', submit);
