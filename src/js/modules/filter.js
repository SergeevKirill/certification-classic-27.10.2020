import $ from 'js#/lib/jquery';
import { default as data } from 'js#/data/goods.json';

export const filter = () => {
	const $form = $('form');
	const $container = $('[data-filter]');
	const $inputFields = $container.find('input, select');
	const encodeOrder = $container.data('filter');
	const $pagination = $('[data-pagination]');
	const maxPage = $pagination.data('pagination');
	const $paginationItems = $pagination.find('[data-pagination-item]');
	const $paginationField = $pagination.find('[data-pagination-field]');
	const $cardContainer = $('[data-card-container]');
	const $paginationCountItems = $('[data-pagination-count-items]');
	const $lastPaginationItem = $('[data-pagination-last]');

	const getFilterValues = () => {
		const values = $form
			.serializeArray()
			.map((el) => ({ [el.name]: el.value }))
			.reduce((acc, item) => {
				const key = Object.keys(item)[0];
				if (!key.endsWith('[]')) {
					acc[key] = +item[key] ? +item[key] : item[key];
				}
				return acc;
			}, {});

		$inputFields.each((i, el) => {
			if (el.name.endsWith('[]')) {
				if (
					el.getAttribute('type') === 'checkbox' ||
					el.getAttribute('type') === 'radio'
				) {
					if ($(el).prop('checked')) {
						const name = el.name.replace('[]', '');
						if (values[name]) {
							values[name].push(+el.value ? +el.value : el.value);
						} else {
							values[name] = [+el.value ? +el.value : el.value];
						}
					}
				} else {
					const name = el.name.replace('[]', '');
					if (values[name]) {
						values[name].push(+el.value ? +el.value : el.value);
					} else {
						values[name] = [+el.value ? +el.value : el.value];
					}
				}
			} else {
				return true;
			}
		});

		return values;
	};

	const getGroupedValues = (values) => {
		const {
			brand = [],
			manufacturer = '',
			model = '',
			year,
			price = [],
			sort,
			perPage = 15,
			page = 1
		} = values;

		const data = {
			params: {
				brand,
				manufacturer,
				model,
				year,
				price
			},
			pagination: {
				sort,
				perPage,
				page
			}
		};

		return data;
	};

	const encodeToUrl = (values) => {
		return encodeOrder.reduce((acc, key) => {
			const value = values[key];
			if (!(!value || !value.length) || value) {
				acc += $.param({ [key]: values[key] });
			}
			return acc;
		}, '');
	};

	let prevPerPage = getFilterValues().perPage;

	$inputFields.on('change', () => {
		console.log(getGroupedValues(getFilterValues()));
		const filterValues = getFilterValues();
		window.history.pushState(
			{},
			'',
			`${window.location.href}?${encodeToUrl(filterValues)}`
		);

		const $filteredData = data.filter((el) => {
			let isSuitable = true;

			encodeOrder.forEach((key) => {
				const value = el[key]?.value || el[key]?.id || el[key];
				const filterValue = filterValues[key];

				if (filterValue && value) {
					if (Array.isArray(filterValue) && key !== 'price') {
						isSuitable = isSuitable && filterValue.includes(value);
					} else if (key === 'price') {
						isSuitable =
							isSuitable &&
							filterValue[0] <= value &&
							filterValue[1] >= value;
					} else {
						isSuitable = isSuitable && filterValue === value;
					}
				}
			});

			return isSuitable;
		});
		const $template = $('#card-template').clone(true, true);

		const sortedData = $filteredData
			.sort((a, b) => {
				const { sort } = getFilterValues();

				switch (sort) {
					case 1:
						return a.price.value > b.price.value ? 1 : -1;
					case 2:
						return a.price.value < b.price.value ? 1 : -1;
					case 3:
						return a.year < b.year ? -1 : 1;
					case 4:
						return a.year > b.year ? -1 : 1;
				}
			})
			.slice(
				filterValues.page * filterValues.perPage,
				filterValues.page * filterValues.perPage + filterValues.perPage
			)
			.reduce((acc, el) => {
				acc += $template
					.html()
					.replace('{brand}', el.brand.name)
					.replace('{image}', el.image.sizes['card-preview'])
					.replace('{alt}', el.image.alt)
					.replace('{manufacturer}', el.manufacturer.name)
					.replace('{year}', el.year)
					.replace('{model}', el.model.name)
					.replace('{currency}', el.price.currency.symbol)
					.replace('{price}', el.price.value);
				return acc;
			}, '');

		$cardContainer.empty().html(sortedData);

		if (prevPerPage !== filterValues.perPage) {
			$paginationField.val(1).trigger('change');
		}

		const totalPagesCount = Math.round(
			$($filteredData).length / filterValues.perPage
		);

		$lastPaginationItem.attr('data-pagination-item', totalPagesCount);

		let newMarkup = '';
		for (let i = filterValues.page; i <= totalPagesCount; i++) {
			newMarkup += `
				<a ${i !== filterValues.page ? 'href="#"' : ''} class="pagination__item ${
				i === filterValues.page ? 'is-active' : ''
			}" data-pagination-item="${i}">
					${i}
				</a>
			`;
		}

		$paginationCountItems.html(newMarkup);
	});

	$pagination.on('click', '[data-pagination-item]', (e) => {
		e.preventDefault();
		const page = $(e.currentTarget).data('pagination-item');

		if (page === 'prev') {
			if (+$paginationField.val() !== 1) {
				$paginationField.val(+$paginationField.val() - 1);
				$paginationField.trigger('change');
			}
		} else if (page === 'next') {
			if (+$paginationField.val() < maxPage) {
				$paginationField.val(+$paginationField.val() + 1);
				$paginationField.trigger('change');
			}
		} else {
			$paginationField.val(+page);
			$paginationField.trigger('change');
		}

		$paginationItems
			.removeClass('is-active')
			.attr('href', '#')
			.filter((i, el) => {
				return $(el).data('pagination-item') === +$paginationField.val();
			})
			.addClass('is-active')
			.removeAttr('href');
	});
};
