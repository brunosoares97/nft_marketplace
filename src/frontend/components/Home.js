import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { Button, Card, Col, Row } from 'react-bootstrap';

const Home = ({ marketplace, nft }) => {
	const [loading, setLoading] = useState(true);
	const [items, setItems] = useState([]);
	const [searchCategory, setSearchCategory] = useState('');

	const loadMarketplaceItems = async () => {
		try {
			const itemCount = await marketplace.itemCount();
			const itemPromises = [];

			for (let i = 1; i <= itemCount.toNumber(); i++) {
				const itemPromise = (async () => {
					const item = await marketplace.items(i);
					if (!item.sold && item.itemId !== 0) {
						try {
							const uri = await nft.tokenURI(item.itemId);
							const response = await fetch(uri);
							const metadata = await response.json();
							const totalPrice = await marketplace.getTotalPrice(item.itemId);
							console.log(uri);
							console.log(item.itemId.toString());
							console.log(item.seller);
							console.log(metadata.name);
							console.log(metadata.description);
							console.log(metadata.image);

							// Add a check for category existence before accessing it
							const category = metadata.category || '';
							return {
								totalPrice,
								itemId: item.itemId,
								seller: item.seller,
								name: metadata.name,
								description: metadata.description,
								image: metadata.image,
								category: category,
							};
						} catch (error) {
							console.error(
								`Error processing metadata for item ID ${item.itemId} - Token ID ${item.tokenId}:`,
								error
							);
						}
					}
				})();

				itemPromises.push(itemPromise);
			}

			const resolvedItems = await Promise.all(itemPromises);
			const filteredItems = resolvedItems.filter(
				(item) =>
					item !== undefined &&
					item.category.toLowerCase().includes(searchCategory.toLowerCase())
			);

			setItems(filteredItems);
			setLoading(false);
		} catch (error) {
			console.error('Error loading marketplace items:', error);
		}
	};

	const buyMarketItem = async (item) => {
		try {
			await (
				await marketplace.purchaseItem(item.itemId, { value: item.totalPrice })
			).wait();
			loadMarketplaceItems();
		} catch (error) {
			console.error('Error buying market item:', error);
		}
	};

	useEffect(() => {
		loadMarketplaceItems();
	}, [searchCategory]); // Trigger the loading when the search category changes

	if (loading) {
		return (
			<main style={{ padding: '1rem 0' }}>
				<h2>Loading...</h2>
			</main>
		);
	}

	const availableItems = items.filter(
		(item) => item.seller !== ethers.constants.AddressZero && !item.sold
	);

	const filteredItems = availableItems.filter((item) =>
		item.category.toLowerCase().includes(searchCategory.toLowerCase())
	);

	return (
		<div className="flex justify-center">
			<div className="px-5 container">
				<input
					type="text"
					placeholder="Search by Category"
					value={searchCategory}
					onChange={(e) => setSearchCategory(e.target.value)}
				/>
				{filteredItems.length > 0 ? (
					<Row xs={1} md={2} lg={4} className="g-4 py-5">
						{filteredItems.map((item, idx) => (
							<Col key={idx} className="overflow-hidden">
								<Card>
									<Card.Img variant="top" src={item.image} />
									<Card.Body color="secondary">
										<Card.Title>{item.name}</Card.Title>
										<Card.Text>{item.description}</Card.Text>
									</Card.Body>
									<Card.Footer>
										<div className="d-grid">
											<Button
												onClick={() => buyMarketItem(item)}
												variant="primary"
												size="lg"
											>
												Buy for {ethers.utils.formatEther(item.totalPrice)} ETH
											</Button>
										</div>
									</Card.Footer>
								</Card>
							</Col>
						))}
					</Row>
				) : (
					<main style={{ padding: '1rem 0' }}>
						<h2>No listed assets</h2>
					</main>
				)}
			</div>
		</div>
	);
};

export default Home;
