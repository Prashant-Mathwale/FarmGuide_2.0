import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

def run_eda():
    df = pd.read_csv('../dataset/sf24/Crop_recommendationV2.csv')
    print("Dataset Shape:", df.shape)
    print("Missing Values:", df.isnull().sum().sum())
    print("Temporal Columns found:", [c for c in df.columns if 'date' in c.lower() or 'time' in c.lower() or 'year' in c.lower()])
    
    # Target distribution
    sns.histplot(df['pest_pressure'])
    plt.title('Pest Pressure Distribution')
    plt.savefig('pest_pressure_dist.png')
    
    # Feature correlations
    numeric = df.select_dtypes(include=['float64', 'int64'])
    corr = numeric.corr()
    plt.figure(figsize=(10,8))
    sns.heatmap(corr, annot=False, cmap='coolwarm')
    plt.title('Correlation Heatmap')
    plt.savefig('correlation_heatmap.png')

if __name__ == "__main__":
    run_eda()
