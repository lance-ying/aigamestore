# Deactivate and remove the corrupted environment
conda init
source ~/.bashrc
conda deactivate
conda env remove -n game

# Clean conda cache
conda clean -a -y

# Create a fresh environment
conda create -n game python=3.10.15 -y
conda activate game




conda remove --force ocl-icd cuda-cudart cuda-cupti cuda-nvtx -y





# Install PyTorch with CUDA support
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118





