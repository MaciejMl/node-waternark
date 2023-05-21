// const Jimp = require('jimp');
import inquirer from 'inquirer';
import Jimp from 'jimp';
import { existsSync } from 'node:fs';

const addTextWatermarkToImage = async function (inputFile, outputFile, text) {
  try {
    const image = await Jimp.read(inputFile);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const textData = {
      text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    };
    image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
    await image.quality(100).writeAsync(outputFile);
    console.log('Action finished with success');
  } catch (error) {
    console.log('Something went wrong... Try again!');
  }
  startApp();
};

const addImageWatermarkToImage = async function (
  inputFile,
  outputFile,
  watermarkFile
) {
  try {
    const image = await Jimp.read(inputFile);
    const watermark = await Jimp.read(watermarkFile);
    const x = image.getWidth() / 2 - watermark.getWidth() / 2;
    const y = image.getHeight() / 2 - watermark.getHeight() / 2;

    image.composite(watermark, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5,
    });
    await image.quality(100).writeAsync(outputFile);
    console.log('Action finished with success');
  } catch (error) {
    console.log('Something went wrong... Try again!');
  }
  startApp();
};

const applyImageModification = async function (image, modificationType) {
  switch (modificationType) {
    case 'make image brighter':
      return image.brightness(0.5);
    case 'increase contrast':
      return image.contrast(0.5);
    case 'make image b&w':
      return image.greyscale();
    case 'invert image':
      return image.invert();
    default:
      return image;
  }
};

const prepareOutputFilename = (filename) => {
  const [name, ext] = filename.split('.');
  return `${name}-with-watermark.${ext}`;
};

const startApp = async () => {
  // Ask if user is ready
  const answer = await inquirer.prompt([
    {
      name: 'start',
      message:
        'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
      type: 'confirm',
    },
  ]);

  // if answer is no, just quit the app
  if (!answer.start) process.exit();

  // ask about input file and watermark type
  const options = await inquirer.prompt([
    {
      name: 'inputImage',
      type: 'input',
      message: 'What file do you want to mark?',
      default: 'MichaelJordan.jpg',
    },
    {
      name: 'applyModification',
      message: 'Do you want to modify the image?',
      type: 'confirm',
    },
    {
      name: 'modificationType',
      type: 'list',
      choices: [
        'make image brighter',
        'increase contrast',
        'make image b&w',
        'invert image',
      ],
      message: 'Choose the type of modification:',
      when: (answers) => answers.applyModification === true,
    },
    {
      name: 'watermarkType',
      type: 'list',
      choices: ['Text watermark', 'Image watermark'],
    },
  ]);

  if (options.applyModification) {
    existsSync('./img/' + options.inputImage)
      ? await Jimp.read('./img/' + options.inputImage).then(async (image) => {
          const modifiedImage = await applyImageModification(
            image.clone(),
            options.modificationType
          );
          await modifiedImage.writeAsync(
            `./img/${prepareOutputFilename(options.inputImage)}`
          );
          console.log('Image modified successfully');

          if (options.watermarkType === 'Text watermark') {
            const text = await inquirer.prompt([
              {
                name: 'value',
                type: 'input',
                message: 'Type your watermark text:',
              },
            ]);
            options.watermarkText = text.value;
            addTextWatermarkToImage(
              `./img/${prepareOutputFilename(options.inputImage)}`,
              `./img/${prepareOutputFilename(options.inputImage)}`,
              options.watermarkText
            );
          } else {
            const image = await inquirer.prompt([
              {
                name: 'filename',
                type: 'input',
                message: 'Type your watermark name:',
                default: 'logo.png',
              },
            ]);
            options.watermarkImage = image.filename;
            addImageWatermarkToImage(
              `./img/${prepareOutputFilename(options.inputImage)}`,
              `./img/${prepareOutputFilename(options.inputImage)}`,
              './img/' + options.watermarkImage
            );
          }
        })
      : console.log('Something went wrong... Try again');
  } else {
    if (options.watermarkType === 'Text watermark') {
      const text = await inquirer.prompt([
        {
          name: 'value',
          type: 'input',
          message: 'Type your watermark text:',
        },
      ]);
      options.watermarkText = text.value;
      if (existsSync('./img/' + options.inputImage)) {
        addTextWatermarkToImage(
          './img/' + options.inputImage,
          `./img/${prepareOutputFilename(options.inputImage)}`,
          options.watermarkText
        );
      } else {
        console.log('Something went wrong... Try again');
      }
    } else {
      const image = await inquirer.prompt([
        {
          name: 'filename',
          type: 'input',
          message: 'Type your watermark name:',
          default: 'logo.png',
        },
      ]);
      options.watermarkImage = image.filename;
      if (
        existsSync('./img/' + options.inputImage) &&
        existsSync('./img/' + options.watermarkImage)
      ) {
        addImageWatermarkToImage(
          './img/' + options.inputImage,
          `./img/${prepareOutputFilename(options.inputImage)}`,
          './img/' + options.watermarkImage
        );
      } else {
        console.log('Something went wrong... Try again');
      }
    }
  }
};

startApp();
