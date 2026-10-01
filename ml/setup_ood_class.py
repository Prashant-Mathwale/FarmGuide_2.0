import os
import tensorflow as tf
from PIL import Image

def setup_ood_class():
    output_dir = 'dataset/plantvillage dataset/color/Not_A_Plant'
    os.makedirs(output_dir, exist_ok=True)
    
    print("Downloading CIFAR-10 dataset for random non-plant images...")
    (x_train, y_train), _ = tf.keras.datasets.cifar10.load_data()
    
    # Save the first 1000 images
    num_images = 1000
    print(f"Saving {num_images} random images (cars, animals, planes, etc.) to {output_dir}...")
    
    for i in range(num_images):
        img_array = x_train[i]
        img = Image.fromarray(img_array)
        img.save(os.path.join(output_dir, f'random_{i}.jpg'))
        
    print(f"Successfully created the 'Not_A_Plant' class with {num_images} images!")
    print("You can now run 'python train_disease_model.py' to retrain the model with this new class.")

if __name__ == "__main__":
    setup_ood_class()
