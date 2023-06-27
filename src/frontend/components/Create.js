import { Buffer } from 'buffer';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { Button, Form, Row } from 'react-bootstrap';
import CreateCategory from './CreateCategory';
const ipfsClient = require('ipfs-http-client');
const projectId = '2ObWKuR4XdZKXsgN9WCLwn0QhU9';
const projectSecret = '78031af1f1fd903393196d4bbd531ead';
const subdomain = 'https://cinematicket.infura-ipfs.io';

const auth =
	'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const client = ipfsClient.create({
	url: 'https://ipfs.infura.io:5001/api/v0',
	headers: {
		authorization: auth,
	},
});

const Create = ({ marketplace, nft }) => {
	const [files, setFiles] = useState([]);
	const [price, setPrice] = useState(null);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [category, setCategory] = useState('');
	const [categories, setCategories] = useState([]);

	useEffect(() => {
		const storedCategories =
			JSON.parse(localStorage.getItem('categories')) || [];
		setCategories(storedCategories);
	}, []);

	const uploadToIPFS = async (event) => {
		event.preventDefault();
		const uploadedFiles = event.target.files;

		const uploadedFilePromises = Array.from(uploadedFiles).map((file) =>
			client.add(file)
		);

		try {
			const results = await Promise.all(uploadedFilePromises);
			const fileURIs = results.map(
				(result) => `${subdomain}/ipfs/${result.path}`
			);
			console.log(fileURIs);
			setFiles(fileURIs);
		} catch (error) {
			console.log('IPFS image upload error:', error);
		}
	};

	const resetForm = () => {
		setFiles([]);
		setPrice(null);
		setName('');
		setDescription('');
		setCategory('');
	};

	const handleCreateCategory = (newCategory) => {
		const updatedCategories = [...categories, newCategory];
		setCategories(updatedCategories);
		localStorage.setItem('categories', JSON.stringify(updatedCategories));
	};

	const createNFT = async () => {
		if (!files.length || !price || !name || !description || !category) return;

		try {
			const initialTokenCount = await nft.tokenCount();
			const listingPrice = ethers.utils.parseEther(price.toString());

			const uploadedMetadata = [];

			// Approve marketplace to spend NFT
			await (await nft.setApprovalForAll(marketplace.address, true)).wait();

			for (let i = 0; i < files.length; i++) {
				const file = files[i];

				const result = await client.add(
					JSON.stringify({ image: file, price, name, description, category })
				);
				console.log(result);

				uploadedMetadata.push({
					name,
					description,
					category,
				});

				mintThenList(result, listingPrice);
			}
			// Reset form after all NFTs are created and listed
			resetForm();
		} catch (error) {
			// Delete the uploaded files from IPFS if an error occurs
			for (const file of files) {
				const cid = file.substring(file.lastIndexOf('/') + 1);
				await client.pin.rm(cid);
				console.log(file);
				console.log('delete uploaded file');
			}
			console.log('Create NFT error:', error);
		}
	};

	const mintThenList = async (result, listingPrice) => {
		const uri = `${subdomain}/ipfs/${result.path}`;
		try {
			// Mint NFT
			await (await nft.mint(uri)).wait();
			// Delay for 1 second between each minting
			await new Promise((resolve) => setTimeout(resolve, 1000));
			// Get tokenId of new NFT
			const id = nft.tokenCount();

			// Add NFT to marketplace
			await (await marketplace.makeItem(nft.address, id, listingPrice)).wait();
		} catch (mintError) {
			// Delete the uploaded file from IPFS if minting fails
			await client.pin.rm(result.cid);
			console.log(uri);
			console.log('delete uploaded');
			console.log('Minting NFT error: ', mintError);
		}
	};

	const handleCategoryChange = (event) => {
		setCategory(event.target.value);
	};

	const handleNewCategorySubmit = (newCategory) => {
		handleCreateCategory(newCategory);
		setCategory(newCategory);
	};

	return (
		<div className="container-fluid mt-5">
			<div className="row">
				<main
					role="main"
					className="col-lg-12 mx-auto"
					style={{ maxWidth: '1000px' }}
				>
					<div className="content mx-auto">
						<Row className="g-4">
							<Form.Control
								type="file"
								required
								name="file"
								onChange={uploadToIPFS}
								multiple // Allow multiple file selection
							/>
							<Form.Control
								onChange={(e) => setName(e.target.value)}
								size="lg"
								required
								type="text"
								placeholder="Name"
							/>
							<Form.Control
								onChange={(e) => setDescription(e.target.value)}
								size="lg"
								required
								as="textarea"
								placeholder="Description"
							/>
							<Form.Control
								onChange={handleCategoryChange}
								value={category}
								size="lg"
								as="select"
								required
							>
								<option value="">Select Category</option>
								{categories.map((category, index) => (
									<option key={index} value={category}>
										{category}
									</option>
								))}
							</Form.Control>
							<CreateCategory onSubmit={handleNewCategorySubmit} />
							<Form.Control
								onChange={(e) => setPrice(e.target.value)}
								size="lg"
								required
								type="number"
								placeholder="Price in ETH"
							/>
							<div className="d-grid px-0">
								<Button onClick={createNFT} variant="primary" size="lg">
									Create & List NFT!
								</Button>
							</div>
						</Row>
					</div>
				</main>
			</div>
		</div>
	);
};

export default Create;
